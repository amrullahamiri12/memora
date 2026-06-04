import Alert from './ui/Alert';

export default function StudyTruncatedNotice({ topic }) {
  if (!topic?.truncated) return null;

  const total = topic.totalAvailable ?? 0;
  const shown = topic.flashcards?.length ?? 0;
  const max = topic.maxCards ?? shown;

  return (
    <Alert type="warning">
      This topic has {total} cards; this session includes {shown} (max {max} per session).
    </Alert>
  );
}
