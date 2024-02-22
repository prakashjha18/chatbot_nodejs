import openai from './config/open-ai.js';
import readlineSync from 'readline-sync';
import colors from 'colors';

// Function to sleep for a specified duration
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(colors.bold.green('Welcome to the Chatbot Program!'));
  console.log(colors.bold.green('You can start chatting with the bot.'));

  const chatHistory = []; // Store conversation history

  while (true) {
    const userInput = readlineSync.question(colors.yellow('You: '));

    try {
      // Construct messages by iterating over the history
      const messages = chatHistory.map(([role, content]) => ({
        role,
        content,
      }));

      // Add latest user input
      messages.push({ role: 'user', content: userInput });

      // Call the API with user input & history
      let completion;
      let retryCount = 0;
      while (true) {
        try {
          completion = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: messages,
          });
          break; // If request succeeds, exit retry loop
        } catch (error) {
          if (error.response && error.response.status === 429) {
            // Retry after exponential backoff
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            retryCount++;
            console.log(colors.yellow(`Received 429 error. Retrying after ${delay/1000} seconds...`));
            await sleep(delay);
          } else {
            // Re-throw error if not rate limit error
            throw error;
          }
        }
      }

      // Get completion text/content
      const completionText = completion.data.choices[0].message.content;

      if (userInput.toLowerCase() === 'exit') {
        console.log(colors.green('Bot: ') + completionText);
        return;
      }

      console.log(colors.green('Bot: ') + completionText);

      // Update history with user input and assistant response
      chatHistory.push(['user', userInput]);
      chatHistory.push(['assistant', completionText]);
    } catch (error) {
      console.error(colors.red(error));
    }
  }
}

main();
