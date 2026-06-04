const FEATURES = [
  { icon: '🧠', title: 'Learn mode', text: 'Mixed quizzes with instant feedback' },
  { icon: '🃏', title: 'Flashcards', text: 'Flip cards and rate what you know' },
  { icon: '📝', title: 'Test mode', text: 'Exam-style runs with a score summary' },
  { icon: '🔥', title: 'Streaks', text: 'Build a daily study habit' },
];

function AuthPanel() {
  return (
    <div className="auth-panel relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-12 lg:py-12 xl:px-16">
      <div className="relative z-10 mx-auto w-full max-w-md">
        <p className="font-display text-3xl font-bold leading-tight text-white xl:text-4xl">
          Study smarter,
          <br />
          remember longer.
        </p>
        <p className="mt-4 text-base leading-relaxed text-teal-50/90">
          Memora turns your subjects into adaptive practice — flashcards, quizzes, and tests in
          one place.
        </p>

        <ul className="mt-10 space-y-4">
          {FEATURES.map((item) => (
            <li key={item.title} className="flex items-start gap-3">
              <span
                className="auth-panel-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                aria-hidden
              >
                {item.icon}
              </span>
              <span>
                <span className="block font-semibold text-white">{item.title}</span>
                <span className="block text-sm text-teal-50/85">{item.text}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="relative mt-12 hidden min-h-[10rem] md:block">
          <div className="auth-panel-card absolute left-0 top-6 h-36 w-52 rotate-[-5deg] rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-100">
              Question
            </p>
            <p className="mt-2 text-sm leading-snug text-white">
              What is supervised learning?
            </p>
          </div>
          <div className="auth-panel-card auth-panel-card-front absolute left-14 top-0 h-36 w-52 rotate-[4deg] rounded-2xl p-5 shadow-xl backdrop-blur-md">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-100">
              Answer
            </p>
            <p className="mt-2 text-sm leading-snug text-white">
              Training on labeled data to predict outputs.
            </p>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, var(--accent-light), transparent)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #5eead4, transparent)' }}
        aria-hidden
      />
    </div>
  );
}

export default AuthPanel;
