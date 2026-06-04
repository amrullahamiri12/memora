const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { pickDistractors } = require('../lib/mcq');

const prisma = new PrismaClient();

const flashcards = [
  // Machine Learning Basics
  {
    topic: 'Machine Learning Basics',
    question: 'What is supervised learning?',
    answer:
      'A type of machine learning where the model is trained on labeled data, learning to map inputs to known outputs.',
    distractor1: 'Learning patterns from data with no labels or target outputs.',
    distractor2: 'Training solely by trial-and-error rewards from an environment.',
    distractor3: 'Compressing data into clusters without predicting specific targets.',
    difficulty: 'EASY',
  },
  {
    topic: 'Machine Learning Basics',
    question: 'What is the difference between classification and regression?',
    answer:
      'Classification predicts discrete categories (e.g., spam/not spam), while regression predicts continuous numerical values (e.g., house prices).',
    distractor1: 'Classification predicts numbers; regression predicts categories.',
    distractor2: 'Both tasks only output continuous real-valued predictions.',
    distractor3: 'Regression is used only for image data; classification only for text.',
    difficulty: 'EASY',
  },
  {
    topic: 'Machine Learning Basics',
    question: 'What is overfitting?',
    answer:
      'When a model learns the training data too well, including noise, resulting in poor performance on unseen data.',
    distractor1: 'When a model is too simple and cannot capture patterns in the training data.',
    distractor2: 'When training and test error are both high because the model under-learns.',
    distractor3: 'When the dataset is too small but the model generalizes perfectly to new data.',
    difficulty: 'MEDIUM',
  },
  {
    topic: 'Machine Learning Basics',
    question: 'What is cross-validation used for?',
    answer:
      'To assess how well a model generalizes by splitting data into multiple train/test folds and averaging the results.',
    distractor1: 'To increase model size by training on the entire dataset with no holdout.',
    distractor2: 'To remove all outliers before any model is ever evaluated.',
    distractor3: 'To guarantee zero error on the training set by memorizing labels.',
    difficulty: 'MEDIUM',
  },
  {
    topic: 'Machine Learning Basics',
    question: 'What is the bias-variance tradeoff?',
    answer:
      'The balance between underfitting (high bias) and overfitting (high variance). Simpler models have higher bias; complex models have higher variance.',
    distractor1: 'The idea that bias and variance always decrease together as models grow.',
    distractor2: 'A rule that only linear models can have low variance.',
    distractor3: 'The practice of always choosing the most complex model available.',
    difficulty: 'HARD',
  },
  // Neural Networks
  {
    topic: 'Neural Networks',
    question: 'What is a neuron in a neural network?',
    answer:
      'A computational unit that takes weighted inputs, applies an activation function, and produces an output passed to the next layer.',
    distractor1: 'A database row that stores one labeled training example.',
    distractor2: 'A fixed random number generator with no learnable parameters.',
    distractor3: 'A loss function that compares predictions to ground truth.',
    difficulty: 'EASY',
  },
  {
    topic: 'Neural Networks',
    question: 'What is backpropagation?',
    answer:
      'An algorithm that computes gradients of the loss with respect to each weight by propagating errors backward through the network, enabling training via gradient descent.',
    distractor1: 'A method that only runs during inference to produce predictions.',
    distractor2: 'A technique for deleting hidden layers to shrink the network.',
    distractor3: 'A data augmentation step that flips images before training.',
    difficulty: 'MEDIUM',
  },
  {
    topic: 'Neural Networks',
    question: 'What is the purpose of an activation function?',
    answer:
      'To introduce non-linearity so the network can learn complex patterns. Common ones include ReLU, sigmoid, and tanh.',
    distractor1: 'To force every layer to output only zero or one with no gradation.',
    distractor2: 'To replace the loss function during the backward pass.',
    distractor3: 'To ensure the network stays strictly linear end-to-end.',
    difficulty: 'EASY',
  },
  {
    topic: 'Neural Networks',
    question: 'What is a convolutional neural network (CNN)?',
    answer:
      'A neural network architecture designed for grid-like data (e.g., images) that uses convolutional layers to detect spatial features like edges and textures.',
    distractor1: 'A network that only processes sequential text with self-attention.',
    distractor2: 'A model that ignores spatial structure and treats pixels as an unordered bag.',
    distractor3: 'An architecture limited to tabular spreadsheets with no spatial dimensions.',
    difficulty: 'MEDIUM',
  },
  {
    topic: 'Neural Networks',
    question: 'What is dropout and why is it used?',
    answer:
      'A regularization technique that randomly deactivates neurons during training to prevent co-adaptation and reduce overfitting.',
    distractor1: 'A method that permanently removes neurons after the first epoch.',
    distractor2: 'A way to increase overfitting by always using every neuron.',
    distractor3: 'A preprocessing step that drops rows from the dataset before training.',
    difficulty: 'MEDIUM',
  },
  // Prompt Engineering
  {
    topic: 'Prompt Engineering',
    question: 'What is prompt engineering?',
    answer:
      'The practice of designing and refining input prompts to elicit desired, accurate, and useful responses from language models.',
    distractor1: 'Writing compiler code that optimizes GPU kernels for inference.',
    distractor2: 'Training a model from scratch on raw hardware without any text.',
    distractor3: 'Deleting all context so the model answers with no instructions.',
    difficulty: 'EASY',
  },
  {
    topic: 'Prompt Engineering',
    question: 'What is few-shot prompting?',
    answer:
      'Providing a few example input-output pairs in the prompt to guide the model toward the desired response format or behavior.',
    distractor1: 'Sending a prompt with zero examples or demonstrations.',
    distractor2: 'Fine-tuning billions of weights on a new dataset from scratch.',
    distractor3: 'Disabling the system message so the model has no guidance.',
    difficulty: 'EASY',
  },
  {
    topic: 'Prompt Engineering',
    question: 'What is chain-of-thought prompting?',
    answer:
      'Encouraging the model to show its reasoning step-by-step before giving a final answer, which improves performance on complex tasks.',
    distractor1: 'Forcing the model to answer with a single word and no explanation.',
    distractor2: 'Chaining multiple unrelated models without passing any intermediate text.',
    distractor3: 'Removing all reasoning so the model guesses immediately.',
    difficulty: 'MEDIUM',
  },
  {
    topic: 'Prompt Engineering',
    question: 'What is prompt chaining?',
    answer:
      'Breaking a complex task into a sequence of prompts where each step\'s output feeds into the next, enabling multi-step workflows.',
    distractor1: 'Using one monolithic prompt with no intermediate steps.',
    distractor2: 'Randomly shuffling tokens in the output to increase diversity.',
    distractor3: 'Running only the final prompt with no prior context from earlier steps.',
    difficulty: 'MEDIUM',
  },
  {
    topic: 'Prompt Engineering',
    question: 'What is the role of system prompts?',
    answer:
      'System prompts set persistent instructions, persona, and constraints that guide the model\'s behavior across an entire conversation.',
    distractor1: 'They are ignored after the first user message in every chat.',
    distractor2: 'They only store API keys and have no effect on model behavior.',
    distractor3: 'They replace the need for any user messages in a conversation.',
    difficulty: 'EASY',
  },
  // AI Ethics
  {
    topic: 'AI Ethics',
    question: 'What is algorithmic bias?',
    answer:
      'Systematic and unfair discrimination in AI outputs caused by biased training data, flawed design, or unintended correlations.',
    distractor1: 'Random noise that makes every prediction equally wrong for all groups.',
    distractor2: 'A preference for faster inference speed over any fairness concern.',
    distractor3: 'Bias that exists only in human survey responses, never in model outputs.',
    difficulty: 'EASY',
  },
  {
    topic: 'AI Ethics',
    question: 'What is explainable AI (XAI)?',
    answer:
      'Methods and techniques that make AI decision-making transparent and understandable to humans, building trust and accountability.',
    distractor1: 'AI systems designed to be completely opaque to all users.',
    distractor2: 'Models that never document or justify any prediction they make.',
    distractor3: 'Techniques that hide feature importance to prevent any audit.',
    difficulty: 'MEDIUM',
  },
  {
    topic: 'AI Ethics',
    question: 'What are the key principles of responsible AI?',
    answer:
      'Fairness, transparency, accountability, privacy, safety, and human oversight — ensuring AI benefits society while minimizing harm.',
    distractor1: 'Maximize profit, opacity, and speed with no regard for harm.',
    distractor2: 'Deploy first and audit never, even for high-risk applications.',
    distractor3: 'Collect all personal data without consent to improve accuracy only.',
    difficulty: 'MEDIUM',
  },
  {
    topic: 'AI Ethics',
    question: 'What is data privacy in the context of AI?',
    answer:
      'Protecting personal and sensitive information used in training and inference, including consent, anonymization, and secure storage.',
    distractor1: 'Publishing all training data publicly to improve transparency.',
    distractor2: 'Sharing user data with third parties without notice or safeguards.',
    distractor3: 'Storing credentials in plain text in public model prompts.',
    difficulty: 'EASY',
  },
  // Large Language Models
  {
    topic: 'Large Language Models',
    question: 'What is a Large Language Model (LLM)?',
    answer:
      'A neural network trained on vast amounts of text data to understand and generate human-like language, such as GPT or Claude.',
    distractor1: 'A small lookup table that maps words to definitions with no learning.',
    distractor2: 'A spreadsheet formula engine with no natural language capability.',
    distractor3: 'Hardware that only converts speech to text with no generative ability.',
    difficulty: 'EASY',
  },
  {
    topic: 'Large Language Models',
    question: 'What is the transformer architecture?',
    answer:
      'A neural network architecture using self-attention mechanisms to process sequences in parallel, enabling efficient training on large text corpora.',
    distractor1: 'A recurrent-only design that cannot use attention between tokens.',
    distractor2: 'A convolution-only model built exclusively for 2D images.',
    distractor3: 'A rule-based parser with no learned parameters or embeddings.',
    difficulty: 'MEDIUM',
  },
  {
    topic: 'Large Language Models',
    question: 'What is tokenization in LLMs?',
    answer:
      'The process of breaking text into smaller units (tokens) that the model processes. Token count affects cost, speed, and context limits.',
    distractor1: 'Encrypting the entire model weights so they cannot be read.',
    distractor2: 'Assigning one permanent English word to exactly one neuron forever.',
    distractor3: 'Deleting punctuation so the model sees only raw bytes with no chunks.',
    difficulty: 'EASY',
  },
  {
    topic: 'Large Language Models',
    question: 'What is the context window?',
    answer:
      'The maximum number of tokens an LLM can process in a single request, including both the prompt and generated response.',
    distractor1: 'The physical size of the monitor displaying the chat UI.',
    distractor2: 'The number of users allowed to log in at the same time.',
    distractor3: 'The total parameters in the model, measured in billions.',
    difficulty: 'MEDIUM',
  },
  {
    topic: 'Large Language Models',
    question: 'What is fine-tuning vs. RAG?',
    answer:
      'Fine-tuning updates model weights on domain-specific data. RAG (Retrieval-Augmented Generation) retrieves relevant documents at inference time without retraining.',
    distractor1: 'Fine-tuning retrieves documents at inference; RAG retrains all weights from scratch.',
    distractor2: 'Both terms mean the same thing: deleting the training dataset.',
    distractor3: 'RAG requires retraining the entire model for every new user question.',
    difficulty: 'HARD',
  },
  {
    topic: 'Machine Learning Basics',
    questionType: 'TRUE_FALSE',
    question: 'Supervised learning requires labeled training data.',
    answer: 'True',
    difficulty: 'EASY',
  },
  {
    topic: 'Machine Learning Basics',
    questionType: 'FILL_BLANK',
    question: 'The bias-variance tradeoff balances underfitting (high ___) and overfitting (high variance).',
    answer: 'bias',
    difficulty: 'HARD',
  },
  {
    topic: 'Neural Networks',
    questionType: 'TRUE_FALSE',
    question: 'Dropout randomly deactivates neurons during training to reduce overfitting.',
    answer: 'True',
    difficulty: 'MEDIUM',
  },
  {
    topic: 'Prompt Engineering',
    questionType: 'FILL_BLANK',
    question: 'Few-shot prompting provides a few ___ in the prompt to guide the model.',
    answer: 'examples',
    difficulty: 'EASY',
  },
  {
    topic: 'AI Ethics',
    questionType: 'TRUE_FALSE',
    question: 'Explainable AI aims to make model decisions understandable to people.',
    answer: 'True',
    difficulty: 'MEDIUM',
  },
  {
    topic: 'Large Language Models',
    questionType: 'FILL_BLANK',
    question: 'Tokenization breaks text into smaller units called ___.',
    answer: 'tokens',
    difficulty: 'EASY',
  },
];

const extraFlashcards = [
  {
    subject: 'Web Dev',
    topic: 'HTML',
    question: 'What is HTML?',
    answer: 'HyperText Markup Language',
    distractor1: 'HyperText Transfer Protocol',
    distractor2: 'A programming language for styling and layout only',
    distractor3: 'A database query language for storing rows and columns',
    difficulty: 'EASY',
  },
];

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@app.com' },
    update: {
      role: 'SUPER_ADMIN',
      passwordHash,
    },
    create: {
      name: 'Admin',
      email: 'admin@app.com',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('Super admin ready: admin@app.com / admin123');

  const allCards = [
    ...flashcards.map((c) => ({ ...c, subject: 'AI Concepts' })),
    ...extraFlashcards,
  ];

  const subjectNames = [...new Set(allCards.map((f) => f.subject))];
  const subjectMap = {};
  const topicMap = {};

  for (const name of subjectNames) {
    const subject = await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    subjectMap[name] = subject.id;
  }

  const topicKeys = [...new Set(allCards.map((f) => `${f.subject}::${f.topic}`))];
  for (const key of topicKeys) {
    const [subjectName, topicName] = key.split('::');
    const topic = await prisma.topic.upsert({
      where: { subjectId_name: { subjectId: subjectMap[subjectName], name: topicName } },
      update: {},
      create: { subjectId: subjectMap[subjectName], name: topicName },
    });
    topicMap[key] = topic.id;
  }

  let created = 0;
  let updated = 0;

  for (const card of allCards) {
    const topicKey = `${card.subject}::${card.topic}`;
    const questionType = card.questionType || 'MCQ';
    const data = {
      topicId: topicMap[topicKey],
      questionType,
      question: card.question,
      answer: card.answer,
      distractor1: questionType === 'MCQ' ? card.distractor1 ?? null : null,
      distractor2: questionType === 'MCQ' ? card.distractor2 ?? null : null,
      distractor3: questionType === 'MCQ' ? card.distractor3 ?? null : null,
      difficulty: card.difficulty,
    };

    const existing = await prisma.flashcard.findFirst({
      where: {
        topicId: topicMap[topicKey],
        question: card.question,
      },
    });

    if (existing) {
      await prisma.flashcard.update({
        where: { id: existing.id },
        data: {
          questionType: data.questionType,
          answer: data.answer,
          distractor1: data.distractor1,
          distractor2: data.distractor2,
          distractor3: data.distractor3,
          difficulty: data.difficulty,
        },
      });
      updated++;
    } else {
      await prisma.flashcard.create({ data });
      created++;
    }
  }

  const backfilled = await backfillMissingDistractors();

  const missing = await prisma.flashcard.count({
    where: {
      questionType: 'MCQ',
      OR: [
        { distractor1: null },
        { distractor2: null },
        { distractor3: null },
        { distractor1: '' },
        { distractor2: '' },
        { distractor3: '' },
      ],
    },
  });

  console.log(
    `Seeded ${allCards.length} flashcards (${created} created, ${updated} updated, ${backfilled} backfilled). Cards missing distractors: ${missing}.`
  );
}

async function backfillMissingDistractors() {
  const cards = await prisma.flashcard.findMany({
    include: { topic: { include: { flashcards: true } } },
  });

  let backfilled = 0;

  for (const card of cards) {
    if (card.questionType !== 'MCQ') continue;
    const needs = !card.distractor1?.trim() || !card.distractor2?.trim() || !card.distractor3?.trim();
    if (!needs) continue;

    const otherAnswers = card.topic.flashcards
      .filter((c) => c.id !== card.id)
      .map((c) => c.answer);

    const [d1, d2, d3] = pickDistractors(card.answer, otherAnswers, 3);

    await prisma.flashcard.update({
      where: { id: card.id },
      data: {
        distractor1: card.distractor1?.trim() || d1,
        distractor2: card.distractor2?.trim() || d2,
        distractor3: card.distractor3?.trim() || d3,
      },
    });
    backfilled++;
  }

  return backfilled;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
