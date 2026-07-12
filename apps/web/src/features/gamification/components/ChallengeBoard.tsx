"use client";

import { useState } from "react";
import type { Challenge } from "../types";

const initialChallenges: Challenge[] = [
  {
    id: "green-commute",
    title: "Green commute week",
    description: "Choose walking, cycling, public transport, or carpooling for three commutes this week.",
    difficulty: "Easy",
    xpReward: 120,
    endDate: "Ends Friday",
    participantCount: 28,
  },
  {
    id: "waste-wise",
    title: "Waste-wise workspace",
    description: "Run a team waste audit and share one practical reduction you put in place.",
    difficulty: "Medium",
    xpReward: 250,
    endDate: "Ends 25 July",
    participantCount: 16,
  },
  {
    id: "community-action",
    title: "Community action day",
    description: "Take part in a verified volunteering activity that supports your local community.",
    difficulty: "Hard",
    xpReward: 400,
    endDate: "Ends 31 July",
    participantCount: 9,
  },
];

const difficultyStyle = {
  Easy: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
  Hard: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function ChallengeBoard() {
  const [challenges, setChallenges] = useState(initialChallenges);
  const [joinedChallengeTitle, setJoinedChallengeTitle] = useState<string | null>(null);

  function joinChallenge(challengeId: string) {
    const challenge = challenges.find((item) => item.id === challengeId);

    if (!challenge || challenge.joined) {
      return;
    }

    setChallenges((currentChallenges) =>
      currentChallenges.map((challenge) =>
        challenge.id === challengeId
          ? {
              ...challenge,
              joined: true,
              participantCount: challenge.participantCount + 1,
            }
          : challenge,
      ),
    );
    setJoinedChallengeTitle(challenge.title);
  }

  return (
    <div>
      {joinedChallengeTitle ? (
        <div
          aria-live="polite"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900"
          role="status"
        >
          <span className="font-semibold">You joined {joinedChallengeTitle}.</span>{" "}
          Your participation is ready for proof submission.
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {challenges.map((challenge) => (
        <article
          className="flex min-h-72 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          key={challenge.id}
        >
          <div className="flex items-center justify-between gap-4">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${difficultyStyle[challenge.difficulty]}`}
            >
              {challenge.difficulty}
            </span>
            <span className="text-sm font-semibold text-orange-700">+{challenge.xpReward} XP</span>
          </div>

          <h2 className="mt-6 text-xl font-semibold text-slate-950">{challenge.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{challenge.description}</p>

          <div className="mt-auto border-t border-slate-100 pt-5 text-sm text-slate-500">
            <div className="flex justify-between">
              <span>{challenge.endDate}</span>
              <span>{challenge.participantCount} participating</span>
            </div>
            <button
              className={`mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                challenge.joined
                  ? "cursor-default bg-emerald-50 text-emerald-700"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              }`}
              disabled={challenge.joined}
              onClick={() => joinChallenge(challenge.id)}
              type="button"
            >
              {challenge.joined ? "Joined - submit proof next" : "Join challenge"}
            </button>
          </div>
        </article>
        ))}
      </div>
    </div>
  );
}
