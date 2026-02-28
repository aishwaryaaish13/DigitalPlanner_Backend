import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const analyzeText = async (req, res) => {
  try {
    const { type, text, data } = req.body;

    // Validate input
    if (!text && !data) {
      return res.status(400).json({ error: 'Text or data input is required' });
    }

    if (!type) {
      return res.status(400).json({ error: 'Analysis type is required' });
    }

    let result;
    switch (type) {
      case 'journal_improvement':
        result = await getImprovedWriting(text);
        break;
      case 'task_breakdown':
        result = await getTaskBreakdown(text);
        break;
      case 'goal_motivation':
        result = await getMotivationalMessage(text || data?.title);
        break;
      case 'mood_analysis':
        result = await getMoodInsight(data);
        break;
      default:
        return res.status(400).json({ error: 'Invalid analysis type' });
    }

    return res.status(200).json({
      message: result.message || result.improved || result.tasks || result.insight,
      improved_text: result.improved,
      ...result
    });
  } catch (error) {
    console.error('Analyze text error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getImprovedWriting = async (text) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        original: text,
        improved: `${text}\n\n[AI Enhancement: Add your OPENAI_API_KEY to .env to enable AI improvements]`
      };
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Improve this journal entry to make it more reflective, insightful, and well-written. Keep the same meaning but enhance clarity and depth:\n\n"${text}"`
      }],
      max_tokens: 300,
      temperature: 0.7
    });

    return {
      original: text,
      improved: completion.choices[0].message.content.trim()
    };
  } catch (error) {
    console.error('Get improved writing error:', error);
    throw new Error('Failed to improve writing: ' + error.message);
  }
};

const getTaskBreakdown = async (text) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        originalGoal: text,
        tasks: [
          { id: 1, task: 'Add OPENAI_API_KEY to .env to enable AI task breakdown', priority: 'high' }
        ]
      };
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Break down this task or goal into 3-5 smaller, actionable steps. Format as a numbered list:\n\n"${text}"`
      }],
      max_tokens: 250,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content.trim();
    const taskLines = response.split('\n').filter(line => line.trim());
    
    const tasks = taskLines.map((line, index) => ({
      id: index + 1,
      task: line.replace(/^\d+\.\s*/, '').trim(),
      priority: index === 0 ? 'high' : index < taskLines.length - 1 ? 'medium' : 'low'
    }));

    return {
      originalGoal: text,
      tasks
    };
  } catch (error) {
    console.error('Get task breakdown error:', error);
    throw new Error('Failed to break down task: ' + error.message);
  }
};

const getMotivationalMessage = async (text) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        message: `You've got this! Your goal of "${text}" is achievable. Add OPENAI_API_KEY to .env for personalized AI motivation!`
      };
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Generate a short, inspiring motivational message (2-3 sentences) for someone working on this goal: "${text}"`
      }],
      max_tokens: 150,
      temperature: 0.8
    });

    return {
      message: completion.choices[0].message.content.trim()
    };
  } catch (error) {
    console.error('Get motivational message error:', error);
    throw new Error('Failed to generate motivation: ' + error.message);
  }
};

const getMoodInsight = async (data) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        detectedMood: 'neutral',
        insight: 'Add OPENAI_API_KEY to .env to enable AI mood analysis',
        recommendation: 'Configure OpenAI to get personalized insights.'
      };
    }

    const moodData = typeof data === 'string' ? data : JSON.stringify(data);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Analyze this mood data and provide: 1) detected mood, 2) insight, 3) recommendation. Keep it concise:\n\n${moodData}`
      }],
      max_tokens: 200,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content.trim();
    
    return {
      detectedMood: 'analyzed',
      insight: response,
      recommendation: 'Continue tracking your mood patterns for better self-awareness.'
    };
  } catch (error) {
    console.error('Get mood insight error:', error);
    throw new Error('Failed to analyze mood: ' + error.message);
  }
};

export { analyzeText };
