import McqCard from './McqCard';
import TrueFalseCard from './TrueFalseCard';
import FillBlankCard from './FillBlankCard';

export default function PracticeQuestionCard({
  card,
  onAnswer,
  testMode = false,
  onAnswered,
  optionIndexOffset = 0,
}) {
  const handleAnswered = (result) => {
    onAnswered?.(result);
  };

  if (card.questionType === 'TRUE_FALSE') {
    return (
      <TrueFalseCard
        question={card.question}
        difficulty={card.difficulty}
        options={card.options}
        onAnswer={onAnswer}
        testMode={testMode}
        onAnswered={handleAnswered}
      />
    );
  }

  if (card.questionType === 'FILL_BLANK') {
    return (
      <FillBlankCard
        parts={card.parts}
        difficulty={card.difficulty}
        onAnswer={onAnswer}
        testMode={testMode}
        onAnswered={handleAnswered}
      />
    );
  }

  return (
    <McqCard
      question={card.question}
      difficulty={card.difficulty}
      options={card.options}
      onAnswer={onAnswer}
      testMode={testMode}
      onAnswered={handleAnswered}
      optionIndexOffset={optionIndexOffset}
    />
  );
}
