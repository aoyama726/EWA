export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://aoyama726.github.io",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "POST only" }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    try {
      const body = await request.json();

      if (!body.image) {
        return new Response(
          JSON.stringify({ error: "画像がありません" }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          }
        );
      }

      const prompt = `
画像内の英単語・英語フレーズを読み取ってください。

各単語について以下を作成してください。

- word
- partOfSpeech
- meaning
- example
- translation
- nuance
- commonPatterns
- usage
- confusedWords
- extraExamples

extraExamplesは必ず2つ作成し、
それぞれ
- english
- japanese
を含めてください。

重要:
- 画像に複数単語がある場合は全部処理する
- exampleには画像にある例文を使う
- 日本語で詳しく説明する
- 必ずJSONのみ返す

形式:

{
  "words": [
    {
      "word": "",
      "partOfSpeech": "",
      "meaning": "",
      "example": "",
      "translation": "",
      "nuance": "",
      "commonPatterns": "",
      "usage": "",
      "confusedWords": "",
      "extraExamples": [
        {
          "english": "",
          "japanese": ""
        },
        {
          "english": "",
          "japanese": ""
        }
      ]
    }
  ]
}
`;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  },
                  {
                    inline_data: {
                      mime_type: body.mimeType || "image/jpeg",
                      data: body.image
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            error: "Gemini API error",
            details: data
          }),
          {
            status: response.status,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          }
        );
      }

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("Geminiから回答がありません");
      }

      return new Response(text, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });

    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "処理に失敗しました",
          details: String(error)
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
  }
};
