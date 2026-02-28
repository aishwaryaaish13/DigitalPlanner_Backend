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
  return {
    original: text,
    improved: `${text}\n\n[AI Enhancement: OpenAI integration disabled. Configure OPENAI_API_KEY to enable AI improvements]`
  };
};

const getTaskBreakdown = async (text) => {
  return {
    originalGoal: text,
    tasks: [
      { id: 1, task: 'Configure OpenAI API key to enable AI task breakdown', priority: 'high' }
    ]
  };
};

const getMotivationalMessage = async (text) => {
  return {
    message: `You've got this! Your goal of "${text}" is achievable. Stay focused and keep moving forward!`
  };
};

const getMoodInsight = async (data) => {
  return {
    detectedMood: 'neutral',
    insight: 'OpenAI integration disabled. Configure OPENAI_API_KEY to enable AI mood analysis.',
    recommendation: 'Continue tracking your mood patterns for better self-awareness.'
  };
};

export { analyzeText };
