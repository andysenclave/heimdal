import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface BoundingBox {
  x: number; // % from left
  y: number; // % from top
  width: number;
  height: number;
}

export interface AnalyzedRegion {
  id: string;
  extractedText: string;
  boundingBox: BoundingBox;
  confidence: number;
  semanticRole:
    | 'heading'
    | 'subheading'
    | 'label'
    | 'body'
    | 'button'
    | 'link'
    | 'caption'
    | 'nav'
    | 'input';
  suggestedKey: string;
  sectionId: string;
}

export interface AnalyzedSection {
  id: string;
  name: string;
  role: string;
  boundingBox: BoundingBox;
  regionIds: string[];
}

export interface ScreenAnalysisResult {
  screenType: string;
  confidence: number;
  sections: AnalyzedSection[];
  regions: AnalyzedRegion[];
  contentTree: Record<string, unknown>;
}

@Injectable()
export class CodexAiService {
  private readonly logger = new Logger(CodexAiService.name);
  private client: Anthropic | null = null;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not set — AI analysis will be unavailable');
    }
  }

  async analyzeScreen(
    imageBase64: string,
    screenSlug: string,
    mimeType: string,
  ): Promise<ScreenAnalysisResult> {
    if (!this.client) {
      throw new InternalServerErrorException(
        'AI analysis not configured: ANTHROPIC_API_KEY is missing',
      );
    }

    const prompt = `You are analyzing a UI screenshot to extract all visible text and structure it as a content management system.

Your task:
1. Identify all visible text elements
2. Group them into logical sections (header, hero, nav, form, footer, etc.)
3. Assign semantic roles: heading, subheading, label, body, button, link, caption, nav, input
4. Generate camelCase key names that describe each text element
5. Estimate bounding boxes as percentages of the image dimensions (x, y, width, height — all 0-100)
6. Detect the overall screen type (authentication, dashboard, profile, settings, onboarding, product-detail, etc.)

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "screenType": "string",
  "confidence": 0.0,
  "sections": [
    {
      "id": "sec_1",
      "name": "string (camelCase section name)",
      "role": "string (navigation|content-primary|form|footer|etc)",
      "boundingBox": { "x": 0, "y": 0, "width": 100, "height": 10 },
      "regionIds": ["reg_1"]
    }
  ],
  "regions": [
    {
      "id": "reg_1",
      "extractedText": "exact text from the image",
      "boundingBox": { "x": 0, "y": 0, "width": 20, "height": 5 },
      "confidence": 0.95,
      "semanticRole": "heading",
      "suggestedKey": "sectionName.keyName",
      "sectionId": "sec_1"
    }
  ],
  "contentTree": {
    "${screenSlug}": {
      "sectionName": {
        "keyName": "extracted text value"
      }
    }
  }
}`;

    const mediaType =
      mimeType === 'image/png'
        ? 'image/png'
        : mimeType === 'image/webp'
          ? 'image/webp'
          : 'image/jpeg';

    let raw: string;
    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: imageBase64 },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      });
      const block = response.content[0];
      raw = block.type === 'text' ? block.text : '';
    } catch (err) {
      this.logger.error('AI analysis failed', err);
      throw new InternalServerErrorException('AI analysis failed. Please try again.');
    }

    try {
      const result = JSON.parse(raw) as ScreenAnalysisResult;
      return result;
    } catch {
      this.logger.error('Failed to parse AI response as JSON', raw.slice(0, 200));
      throw new InternalServerErrorException('AI returned invalid JSON. Please try again.');
    }
  }

  async translateContent(
    contentTree: Record<string, unknown>,
    fromLocale: string,
    toLocale: string,
    context: { screenType?: string; appName?: string },
  ): Promise<Record<string, unknown>> {
    if (!this.client) {
      throw new InternalServerErrorException(
        'AI translation not configured: ANTHROPIC_API_KEY is missing',
      );
    }

    const prompt = `You are translating UI text for a ${context.screenType ?? 'mobile/web'} app${context.appName ? ` called "${context.appName}"` : ''}.

Source language: ${fromLocale}
Target language: ${toLocale}

Rules:
- Translate ONLY the string values, preserve all JSON structure and keys exactly
- Keep placeholder variables like {{userName}} unchanged
- Keep very short technical strings (like "en", "hi", single letters) as-is
- Match the tone of the source (formal/informal) in the target language
- Return ONLY the translated JSON, no explanation, no markdown

Source JSON:
${JSON.stringify(contentTree, null, 2)}`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });
      const block = response.content[0];
      const raw = block.type === 'text' ? block.text : '{}';
      return JSON.parse(raw) as Record<string, unknown>;
    } catch (err) {
      this.logger.error('AI translation failed', err);
      throw new InternalServerErrorException('AI translation failed. Please try again.');
    }
  }

  async suggestKey(text: string, semanticRole: string, parentKey: string): Promise<string> {
    if (!this.client) return this.deriveKeyLocally(text, semanticRole);

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: `Generate a camelCase key name for this UI text.
Text: "${text}"
Semantic role: ${semanticRole}
Parent key context: ${parentKey}
Rules: camelCase only, no special chars, 2-4 words max, descriptive.
Return ONLY the key name, nothing else.`,
          },
        ],
      });
      const block = response.content[0];
      const key =
        block.type === 'text' ? block.text.trim().replace(/[^a-zA-Z0-9]/g, '') : '';
      return key || this.deriveKeyLocally(text, semanticRole);
    } catch {
      return this.deriveKeyLocally(text, semanticRole);
    }
  }

  private deriveKeyLocally(text: string, semanticRole: string): string {
    const suffix: Record<string, string> = {
      button: 'Button',
      heading: 'Title',
      label: 'Label',
      link: 'Link',
      body: 'Text',
      caption: 'Caption',
    };
    const base = text
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .slice(0, 3)
      .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
      .join('');
    return base + (suffix[semanticRole] ?? '');
  }
}
