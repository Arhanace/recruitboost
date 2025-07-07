import Anthropic from '@anthropic-ai/sdk';
import { sendErrorToAdmin } from "./libs/sendErrorToAdmin"; // adjust path
import { storage } from "./storage";


// The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released after Feb 2024
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // apiKey: "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"
});

export async function generateEmailTemplate(
  sportInfo: string,
  studentInfo: string,
  coachDetails?: string,
  tone: string = 'professional',
  teamPerformanceData?: string
): Promise<{ subject: string; body: string }> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }

    const systemPrompt = `You are an AI assistant that helps high school athletes craft personalized, 
    effective emails to college coaches for recruiting purposes. Your task is to generate a complete,
    ready-to-send email that the athlete can use immediately without any further editing.
    
    Create a compelling subject line and email body that:
    - Is highly personalized to both the athlete and coach
    - Has a ${tone} tone
    - Is concise but informative (200-400 words)
    - Includes specific, relevant student accomplishments and stats from their profile, highlighting key performances that align with the program's needs
    - References specific stats like points per game, rebounds, assists, or other relevant metrics
    - Explains clearly why the athlete is interested in this specific program/school
    - Maintains proper email etiquette
    - Includes a clear call to action (like requesting a call, visit, or further information)
    - Addresses the coach by name and title
    - References the specific school, program, and recent team achievements if available
    - Comments specifically on the team's performance from the previous season if that information is available
    - Uses a natural, authentic-sounding voice (not overly formal or robotic)
    - Includes proper greeting and sign-off
    - Mentions relevant academic achievements if available
    
    YOU MUST FORMAT YOUR RESPONSE AS JSON with subject and body fields.`;

    const userPrompt = `Please create a personalized email for a high school ${sportInfo} athlete 
    reaching out to a college coach for athletic recruitment.

    About the student athlete:
    ${studentInfo}
    
    ${
      coachDetails
        ? `About the coach and program I'm contacting:
    ${coachDetails}`
        : ''
    }

    ${
      teamPerformanceData
        ? `Team's recent performance:
    ${teamPerformanceData}`
        : ''
    }
    
    This is the student's initial outreach and they want to:
    - Express genuine interest in the program
    - Highlight their relevant athletic and academic achievements with specific stats (points per game, rebounds, etc.)
    - Draw connections between their playing style/abilities and the team's needs or playing style
    - Reference the team's previous season performance and how they could contribute
    - Request more information about recruitment and/or a conversation with the coach
    - Make a positive first impression
    
    REMEMBER: Format your response as JSON with "subject" and "body" fields. The email must be 
    completely personalized and ready to send without any placeholders or need for editing.
    
    The student prefers an authentic-sounding email that doesn't sound like it was written by AI.`;

    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      system: systemPrompt,
      max_tokens: 1500,
      temperature: 0.7,
      messages: [{ role: 'user', content: userPrompt }]
    });


    // Extract the response content and parse it as JSON
    if (!response.content || response.content.length === 0) {
      // Fetch user if you can get their ID here or pass from outside
      const user = await storage.getUser(2); // replace 1 with dynamic ID if possible
      await sendErrorToAdmin(user, "generateEmailTemplate res", response);
      throw new Error('Invalid response format from Claude API');
    }
    
    // Fetch user if you can get their ID here or pass from outside
    const user = await storage.getUser(2); // replace 1 with dynamic ID if possible
    await sendErrorToAdmin(user, "generateEmailTemplate res", response.content);
    
    // For newer versions of SDK, content is an array of content blocks
    // Extract text from the first text block
    let responseText = '';
    for (const content of response.content) {
      if ('text' in content) {
        responseText = content.text;
        break;
      }
    }
    
    if (!responseText) {
      // Fetch user if you can get their ID here or pass from outside
      const user = await storage.getUser(2); // replace 1 with dynamic ID if possible
      await sendErrorToAdmin(user, "generateEmailTemplate res", response);
      throw new Error('No text content found in response');
    }
    let result;
    
    try {
      // Try to parse as JSON directly
      result = JSON.parse(responseText);
    } catch (e) {
      // If direct parsing fails, try to extract JSON from the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (err) {
          // Fetch user if you can get their ID here or pass from outside
          const user = await storage.getUser(2); // replace 1 with dynamic ID if possible
          await sendErrorToAdmin(user, "generateEmailTemplate res", err);
          throw new Error('Failed to extract valid JSON from the response');
        }
      } else {
        // Fetch user if you can get their ID here or pass from outside
        const user = await storage.getUser(2); // replace 1 with dynamic ID if possible
        await sendErrorToAdmin(user, "generateEmailTemplate res", err);
        throw new Error('Could not find JSON in response');
      }
    }
    return {
      subject: result.subject,
      body: result.body,
    };
  } catch (error) {
    console.error('Error generating email template:', error);

    // Fetch user if you can get their ID here or pass from outside
    const user = await storage.getUser(2); // replace 1 with dynamic ID if possible
    await sendErrorToAdmin(user, "generateEmailTemplate error", error);
    
    throw error;
  }
}