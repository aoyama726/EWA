export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://aoyama726.github.io",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== "POST") {
      return jsonResponse(
        {
          error: "POST only",
        },
        405,
        corsHeaders
      );
    }

    try {
      if (!env.GEMINI_API_KEY) {
        return jsonResponse(
          {
            error: "GEMINI_API_KEY が設定されていません",
          },
          500,
          corsHeaders
        );
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return jsonResponse(
          {
            error: "リクエストのJSONが正しくありません",
          },
          400,
          corsHeaders
        );
      }

      const imageBase64 = body?.image;
      const mimeType = body?.mimeType || "image/jpeg";

      if (!imageBase64 || typeof imageBase64 !== "string") {
        return jsonResponse(
          {
            error: "画像がありません",
          },
          400,
          corsHeaders
        );
      }

      const prompt = `
あなたは日本人英語学習者向けの英単語帳作成AIです。

添付された英語教材・単語帳の写真を読み取り、
写真内で学習対象になっている英単語・英語フレーズを抽出してください。

写真に複数の対象単語がある場合は、
対象になっているものをすべて処理してください。

====================
最重要ルール
====================

写真に書かれている

・英単語 / 英語フレーズ
・その単語に対応する例文
・写真内の情報

を正確に読み取ってください。

写真に書かれていない単語を、
学習対象として勝手に追加してはいけません。

読みにくい文字を無理に推測して、
存在しない単語を作らないでください。

同じ単語が複数回見えても、
基本的には1つにまとめてください。

====================
出力する6項目
====================

各単語について必ず以下の6項目を作成してください。

1. word

アプリの
「英単語・フレーズ」
に入れる内容です。

写真に載っている英単語または英語フレーズを入れてください。

余計な説明や日本語は入れないでください。

例：

ensure

register

reply

remove

discrimination against minorities


2. example

アプリの
「例文」
に入れる内容です。

写真にその単語の例文・使用例が載っている場合は、
写真の英文をできるだけ正確にそのまま入れてください。

重要：

example欄ではAIが新しく例文を作ってはいけません。

必ず写真に載っている英文だけを使用してください。

写真に対応する例文がない場合は、

""

にしてください。


3. meaning

アプリの
「意味」
に入れる内容です。

ここには
英単語・フレーズそのものの日本語の意味
を入れてください。

例文全体の翻訳ではありません。

日本人英語学習者が覚えやすい、
簡潔で自然な日本語にしてください。

複数の代表的な意味がある場合は、
重要なものを簡潔にまとめて構いません。

例：

register
→ 登録する

reply
→ 返事をする、返信する

remove
→ 取り除く、外す


4. translation

アプリの
「例文の日本語訳」
に入れる内容です。

exampleに入れた
写真内の英文を自然な日本語に訳してください。

exampleが空文字の場合は、
translationも必ず

""

にしてください。

直訳しすぎず、
実際に日本語として自然な表現にしてください。


5. partOfSpeech

アプリの
「使い方メモ」
に入れる内容です。

ここには品詞だけを簡潔に入れてください。

説明文は入れないでください。

基本的に英語表記を使用してください。

例：

noun

verb

adjective

adverb

noun / verb

phrase

phrasal verb

preposition

conjunction

pronoun

必要な場合だけ複数の品詞を書いて構いません。


6. memo

アプリの
「自由メモ」
に入れる内容です。

ここには、
その単語を実際に使えるようになるための
詳しい学習説明を日本語で作成してください。

単なる辞書の意味だけではなく、

・ニュアンス
・使う場面
・よく使う形
・自然な組み合わせ
・似た単語との違い
・追加例文

まで分かる内容にしてください。

ただし、
必要以上に長すぎる説明にはしないでください。

====================
memoの基本構成
====================

最初に、
その単語の意味・ニュアンスを
1〜3文程度で日本語で説明してください。

例：

ensure は「ある状態や結果が確実になるようにする」という意味です。
ただ確認するだけではなく、必要な行動をして結果を確実にするニュアンスがあります。


次に必ず、

よく使う形：

という見出しを入れてください。

その下に、
よく使う語句・前置詞・構文・コロケーションを
複数紹介してください。

各項目は必ず

* 

から始めてください。

例：

よく使う形：

* ensure safety = 安全を確保する
* ensure quality = 品質を保証する
* ensure success = 成功を確実にする
* ensure that ～ = ～であることを確実にする


====================
追加例文
====================

AIが考えた自然な追加例文を
必ず2つ作ってください。

写真のexampleとは違う英文にしてください。

日常会話や実際の生活で使える自然な英文を優先してください。

見出しは必ず

追加例文①

追加例文②

にしてください。

形式：

追加例文①
英文
→ 日本語訳

追加例文②
英文
→ 日本語訳

例：

追加例文①
Please ensure that all doors are locked.
→ すべてのドアに鍵がかかっていることを確認してください。

追加例文②
Regular checks help ensure safety.
→ 定期的な点検は安全の確保に役立ちます。


====================
似た単語との違い
====================

その単語に、
日本人学習者が混同しやすい似た英単語がある場合は、
違いも説明してください。

見出しは

〇〇との違い

という形式にしてください。

各違いは
* 
を使って簡潔に説明してください。

例：

make sureとの違い

* make sure = 日常会話で「ちゃんと確認する」
* ensure = 何かをして結果や状態を確実にする。ややフォーマル


assureとの違い

* ensure = 結果や状態を確実にする
* assure = 人に「大丈夫」と保証して安心させる

I assure you that it’s safe.
→ 安全だとあなたに保証します。


似た単語が特にない場合は、
無理に作る必要はありません。

====================
写真の例文について
====================

非常に重要です。

写真に載っている例文は

example

にだけ入れてください。

memo内の追加例文①・②は
AIが新しく考えた別の文章にしてください。

同じ英文を繰り返さないでください。

====================
写真読み取りルール
====================

・写真に複数単語があればすべて処理する

・写真に載っていない単語を対象単語として追加しない

・単語と例文の対応関係を間違えない

・読みにくい文字を無理に推測しない

・判別できない単語は無理に出力しない

・日本語訳は自然な日本語にする

・写真内に単語と例文だけあり、意味が見えにくい場合でも、wordが明確ならmeaningはAIが補ってよい

・写真内の日本語訳が見える場合も参考にしてよい

====================
JSON出力ルール
====================

必ずJSONだけを返してください。

JSONの前後に説明文を書かないでください。

Markdownコードブロックを付けないでください。

必ず次の形式にしてください。

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

      const responseText = await geminiResponse.text();

      let geminiData;

      try {
        geminiData = JSON.parse(responseText);
      } catch {
        geminiData = null;
      }

      if (!geminiResponse.ok) {
        return jsonResponse(
          {
            error: "Gemini API error",
            status: geminiResponse.status,
            details: geminiData || responseText,
          },
          geminiResponse.status,
          corsHeaders
        );
      }

      const text =
        geminiData?.candidates?.[0]?.content?.parts
          ?.map((part) => part?.text || "")
          .join("")
          .trim() || "";

      if (!text) {
        return jsonResponse(
          {
            error: "Geminiから回答を取得できませんでした",
            details: geminiData,
          },
          500,
          corsHeaders
        );
      }

      const cleanedText = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      let parsed;

      try {
        parsed = JSON.parse(cleanedText);
      } catch {
        return jsonResponse(
          {
            error: "GeminiのJSONを読み取れませんでした",
            raw: cleanedText,
          },
          500,
          corsHeaders
        );
      }

      if (!parsed || !Array.isArray(parsed.words)) {
        return jsonResponse(
          {
            error: "Geminiの回答形式が正しくありません",
            raw: parsed,
          },
          500,
          corsHeaders
        );
      }

      const cleanedWords = parsed.words
        .map((item) => {
          const word = cleanString(item?.word);
          const example = cleanString(item?.example);
          const meaning = cleanString(item?.meaning);
          const translation = cleanString(item?.translation);
          const partOfSpeech = cleanString(item?.partOfSpeech);
          const memo = cleanString(item?.memo);

          return {
            word,
            example,
            meaning,
            translation: example ? translation : "",
            partOfSpeech,
            memo,
          };
        })
        .filter((item) => item.word && item.meaning);

      const uniqueWords = [];
      const seen = new Set();

      for (const item of cleanedWords) {
        const key = item.word.toLocaleLowerCase("en-US");

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        uniqueWords.push(item);
      }

      if (uniqueWords.length === 0) {
        return jsonResponse(
          {
            error: "写真から登録できる英単語を見つけられませんでした",
            words: [],
          },
          422,
          corsHeaders
        );
      }

      return jsonResponse(
        {
          words: uniqueWords,
        },
        200,
        corsHeaders
      );
    } catch (error) {
      console.error(error);

      return jsonResponse(
        {
          error: "処理に失敗しました",
          details:
            error instanceof Error
              ? error.message
              : String(error),
        },
        500,
        corsHeaders
      );
    }
  },
};

function cleanString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function jsonResponse(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
