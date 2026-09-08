export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://aoyama726.github.io",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "POST only",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    try {
      if (!env.GEMINI_API_KEY) {
        return new Response(
          JSON.stringify({
            error: "GEMINI_API_KEY が設定されていません",
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const body = await request.json();

      const imageBase64 = body.image;
      const mimeType = body.mimeType || "image/jpeg";

      if (!imageBase64) {
        return new Response(
          JSON.stringify({
            error: "画像がありません",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const prompt = `
あなたは日本人英語学習者向けの英単語帳作成AIです。

添付画像を読み取り、
画像内で「学習対象になっている英単語・英語フレーズ」をすべて抽出してください。

画像に複数の対象単語がある場合は、
すべてまとめて処理してください。

重要:
写真に書かれている単語と、
その単語に対応する写真内の例文を正確に読み取ってください。

各単語について、以下の6項目をアプリに登録できるように作成してください。

1. word
アプリの「英単語・フレーズ」に入れる内容。

写真に載っている英単語または英語フレーズを入れてください。

2. example
アプリの「例文」に入れる内容。

写真にその単語の例文が載っている場合、
写真に書かれている例文をできるだけそのまま正確に入れてください。

写真に例文がない場合は空文字 "" にしてください。

重要:
example欄にはAIが新しく作った例文を入れないでください。
必ず写真に載っている例文だけです。

3. meaning
アプリの「意味」に入れる内容。

その英単語・フレーズ自体の主要な日本語の意味を、
簡潔で分かりやすく入れてください。

これは例文の日本語訳ではありません。

4. translation
アプリの「例文の日本語訳」に入れる内容。

exampleに入れた写真の例文を、
自然な日本語に訳してください。

exampleが空文字の場合、
translationも空文字 "" にしてください。

5. partOfSpeech
アプリの「使い方メモ」に入れる内容。

品詞だけを簡潔に入れてください。

例:
noun
verb
adjective
adverb
noun / verb
phrase
phrasal verb

必要に応じて複数の品詞を入れて構いません。

6. memo
アプリの「自由メモ」に入れる内容。

ここには、
その単語を勉強するための詳しい説明を
日本語で作成してください。

必ず以下のような形式を基本にしてください。

例:

ensure は「ある状態や結果が確実になるようにする」という意味です。

よく使う形：

* ensure safety = 安全を確保する
* ensure quality = 品質を保証する
* ensure success = 成功を確実にする
* ensure that ～ = ～であることを確実にする

追加例文①
Please ensure that all doors are locked.
→ すべてのドアに鍵がかかっていることを確認してください。

追加例文②
Regular checks help ensure safety.
→ 定期的な点検は安全の確保に役立つ。

make sureとの違い

* make sure = 日常的に「ちゃんと確認する」
* ensure = よりフォーマルに「確実な状態にする」

assureとの違い

* ensure = 結果や状態を確実にする
* assure = 人に「大丈夫」と保証して安心させる

I assure you that it’s safe.
→ 安全だとあなたに保証します。


memoの詳しいルール:

- 最初に、その単語の意味・ニュアンスを日本語で説明してください。
- 日本人英語学習者が理解しやすい説明にしてください。
- 必要なら「どんな場面で使うか」も説明してください。
- 「よく使う形：」という項目を入れてください。
- よく使われる語句・前置詞・構文・コロケーションを複数紹介してください。
- 各項目は "* " から始めてください。
- AIが考えた自然な追加例文を必ず2つ作ってください。
- 見出しは必ず「追加例文①」「追加例文②」にしてください。
- 追加例文の次の行に必ず「→ 日本語訳」を入れてください。
- 追加例文は写真のexampleとは別の文章にしてください。
- 日常で実際に使える自然な英文を優先してください。
- 混同しやすい英単語がある場合は、その違いを説明してください。
- 見出しは「〇〇との違い」の形にしてください。
- 違いの説明は "* " を使って分かりやすくしてください。
- 必要なら、混同語の追加例文と日本語訳も入れてください。
- 似た単語が複数ある場合は複数説明して構いません。
- 単なる辞書的な意味だけではなく、実際の使い分けが分かる説明にしてください。
- 不自然な日本語や直訳を避けてください。
- 説明は長すぎず、しかし学習に必要な情報は省略しないでください。

写真読み取りルール:

- 写真に複数単語がある場合、すべて処理してください。
- 写真に載っていない単語を勝手に対象単語として追加しないでください。
- 写真の例文と単語の対応関係を間違えないでください。
- 写真の文字が読みづらい場合でも、推測しすぎないでください。
- 判別できない単語は無理に作らないでください。
- 日本語訳は自然な日本語を優先してください。

出力ルール:

必ずJSONだけを返してください。
JSONの前後に説明を書かないでください。
Markdownのコードブロックも付けないでください。

必ずこの形式で返してください:

{
  "words": [
    {
      "word": "",
      "example": "",
      "meaning": "",
      "translation": "",
      "partOfSpeech": "",
      "memo": ""
    }
  ]
}
`;

      const geminiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: prompt,
                  },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: imageBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      const geminiData = await geminiResponse.json();

      if (!geminiResponse.ok) {
        return new Response(
          JSON.stringify({
            error: "Gemini API error",
            details: geminiData,
          }),
          {
            status: geminiResponse.status,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const text =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error(
          "Geminiから回答を取得できませんでした"
        );
      }

      let parsed;

      try {
        parsed = JSON.parse(text);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "GeminiのJSONを読み取れませんでした",
            raw: text,
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (!Array.isArray(parsed.words)) {
        return new Response(
          JSON.stringify({
            error: "Geminiの回答形式が正しくありません",
            raw: parsed,
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const cleanedWords = parsed.words
        .map((item) => ({
          word:
            typeof item.word === "string"
              ? item.word.trim()
              : "",

          example:
            typeof item.example === "string"
              ? item.example.trim()
              : "",

          meaning:
            typeof item.meaning === "string"
              ? item.meaning.trim()
              : "",

          translation:
            typeof item.translation === "string"
              ? item.translation.trim()
              : "",

          partOfSpeech:
            typeof item.partOfSpeech === "string"
              ? item.partOfSpeech.trim()
              : "",

          memo:
            typeof item.memo === "string"
              ? item.memo.trim()
              : "",
        }))
        .filter(
          (item) =>
            item.word &&
            item.meaning
        );

      return new Response(
        JSON.stringify({
          words: cleanedWords,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error(error);

      return new Response(
        JSON.stringify({
          error: "処理に失敗しました",
          details: String(error),
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  },
};
