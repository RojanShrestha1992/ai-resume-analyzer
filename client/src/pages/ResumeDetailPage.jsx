import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import Spinner from "../components/Spinner";

const ResumeDetailPage = () => {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const fetchResume = useCallback(async () => {
    try {
      const res = await API.get(`resume/${id}`);
      setResume(res.data.resume);
    } catch (err) {
      if (err.response?.status == 401) {
        navigate("/");
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await API.get(`resume/${id}`);
        if (!ignore) setResume(res.data.resume);
      } catch (err) {
        if (err.response?.status == 401) {
          navigate("/");
          return;
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [id, navigate]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await API.post(`resume/${id}/analyze`);
      setResume(res.data.resume);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to analyze resume.");
      fetchResume();
    } finally {
      setAnalyzing(false);
    }
  };

  const renderedList = (title, items, color) => {
    if (!items || items.length === 0) {
      return null;
    }
    const colors = {
      green: {
        chip: "bg-emerald-50 border-emerald-200 text-emerald-700",
        dot: "bg-emerald-500",
      },
      blue: {
        chip: "bg-sky-50 border-sky-200 text-sky-700",
        dot: "bg-sky-500",
      },
      red: {
        chip: "bg-rose-50 border-rose-200 text-rose-700",
        dot: "bg-rose-500",
      },
      yellow: {
        chip: "bg-amber-50 border-amber-200 text-amber-700",
        dot: "bg-amber-500",
      },
      purple: {
        chip: "bg-violet-50 border-violet-200 text-violet-700",
        dot: "bg-violet-500",
      },
    };
    return (
      <div className="animate-fade-in rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
          <span className={`h-2 w-2 rounded-full ${colors[color].dot}`} />
          {title}
        </h2>
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => {
            return (
              <span
                key={index}
                className={`rounded-lg border px-3 py-1.5 text-sm ${colors[color].chip}`}
              >
                {item}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner className="h-9 w-9" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="mb-4 text-lg text-rose-600">
            {error || "Resume not found."}
          </p>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const scoreColor =
    resume.score >= 70
      ? "stroke-emerald-500"
      : resume.score >= 40
        ? "stroke-amber-500"
        : "stroke-rose-500";
  const CIRCUMFERENCE = 264;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Back link */}
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to dashboard
        </Link>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Header card */}
        <div className="flex animate-slide-up items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="truncate text-xl font-bold tracking-tight text-slate-900">
                {resume.originalName}
              </h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Uploaded {new Date(resume.createdAt).toLocaleString()}
            </p>
          </div>

          {resume.analysisStatus === "completed" && resume.score !== null && (
            <div className="shrink-0">
              <div className="relative h-24 w-24">
                <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    strokeWidth="8"
                    className="stroke-slate-100"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={
                      CIRCUMFERENCE - (CIRCUMFERENCE * resume.score) / 100
                    }
                    className={`${scoreColor} transition-all duration-700 ease-out`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900">
                    {resume.score}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    score
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pending state */}
        {resume.analysisStatus === "pending" && (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-medium text-slate-700">
              This resume hasn't been analyzed yet
            </p>
            <p className="mb-6 mt-1 text-sm text-slate-500">
              Run the AI analysis to get detailed feedback and a score.
            </p>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {analyzing ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Analyzing...
                </>
              ) : (
                "Analyze Resume"
              )}
            </button>
          </div>
        )}

        {/* Processing state */}
        {(resume.analysisStatus === "processing" || analyzing) && (
          <div className="mt-10 flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <Spinner className="mb-4 h-9 w-9" />
            <p className="font-medium text-slate-700">
              AI is analyzing your resume...
            </p>
            <p className="mt-1 text-sm text-slate-500">
              This usually takes a few seconds.
            </p>
          </div>
        )}

        {/* Failed state */}
        {resume.analysisStatus === "failed" && !analyzing && (
          <div className="mt-10 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
            <p className="mb-4 font-medium text-rose-600">
              Analysis failed. Please try again.
            </p>
            <button
              onClick={handleAnalyze}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Retry Analysis
            </button>
          </div>
        )}

        {/* Completed sections */}
        {resume.analysisStatus === "completed" && (
          <div className="mt-6 space-y-4">
            {renderedList("Skills", resume.skills, "blue")}
            {renderedList("Missing Skills", resume.missingSkills, "yellow")}
            {renderedList("Strengths", resume.strengths, "green")}
            {renderedList("Weakness", resume.weakness, "red")}
            {renderedList("Suggestions", resume.suggestions, "purple")}
          </div>
        )}
      </main>
    </div>
  );
};

export default ResumeDetailPage;
