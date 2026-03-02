export async function POST(request: Request) {
  try {
    // Parse the incoming JSON request
    const { messages } = await request.json();

    const fileContent =
      messages?.[0]?.content?.replace(/^Here is the file content:\n/, "") || "";
    const userPrompt = messages?.[1]?.content || "";

    const userContent = `Document Content: ${fileContent} \n\nUser Query: ${userPrompt}`;

    // Check rate limits
    const rateCheck = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    const rateLimitInfo = {
      limit: rateCheck.headers.get("x-ratelimit-limit-requests"),
      remaining: rateCheck.headers.get("x-ratelimit-remaining-requests"),
      reset: rateCheck.headers.get("x-ratelimit-reset-requests"),
    };

    console.log("🔄 OpenAI Rate Limit Info:", rateLimitInfo);

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are an expert document analyst and content generator. Your role is to analyze document content and generate relevant responses based on user queries.

The document could be in various formats (PDF, CSV, XLSX, XLS, DOC, DOCX, TXT) and contains important information.
      
Your responses should:
- Analyze the document content thoroughly
- Extract relevant information based on the user's query
- Provide accurate and contextually appropriate responses
- Maintain the original meaning and context from the document
- Format the response in a clear and organized manner
- Highlight key points and important information
- Cross-reference information when necessary
- Be precise and avoid making assumptions not supported by the document
      
If the document content is not relevant to the query, clearly state this and suggest what kind of information would be more appropriate.`,
            },
            { role: "user", content: userContent },
          ],
          stream: true,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const err = await openaiResponse.text();
      console.error("OpenAI API Error:", err);
      return new Response(
        JSON.stringify({
          error: "Failed to analyze document and generate response",
        }),
        { status: openaiResponse.status }
      );
    }

    return new Response(openaiResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in /api/chat-with-doc:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to analyze document and generate response",
      }),
      { status: 500 }
    );
  }
}
