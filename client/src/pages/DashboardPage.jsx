import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import Spinner from "../components/Spinner";
import StatusBadge from "../components/StatusBadge";

const DashboardPage = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await API.get("/resume/all");
        setResumes(res.data.resumes);
      } catch (err) {
        if (err.response?.status == 401) {
          navigate("/");
          return;
        }
        setError("Failed to load resumes.");
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, [navigate]);

  const handleDelete = async (id) => {
    try {
      await API.delete(`resume/${id}`);
      setResumes(resumes.filter((resume) => resume._id !== id));
    } catch {
      setError("Failed to delete resume.");
    }
  };
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner className="h-9 w-9" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Your Resumes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {resumes.length} {resumes.length === 1 ? "resume" : "resumes"}{" "}
            uploaded
          </p>
        </div>

        {resumes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center animate-fade-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              No resumes yet
            </h2>
            <p className="mb-6 mt-1 text-sm text-slate-500">
              Upload your first resume to get AI-powered feedback.
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Upload a resume
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((resume, index) => (
              <div
                key={resume._id}
                className="flex animate-fade-in items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-md"
                style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
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
                  <div className="min-w-0">
                    <h3 className="truncate font-medium text-slate-900">
                      {resume.originalName}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Uploaded {new Date(resume.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  {resume.score !== null && resume.score !== undefined && (
                    <span className="text-sm font-semibold text-slate-700">
                      {resume.score}
                      <span className="font-normal text-slate-400">/100</span>
                    </span>
                  )}
                  <StatusBadge status={resume.analysisStatus} />
                  <Link
                    to={`/resume/${resume._id}`}
                    className="text-sm font-medium text-indigo-600 transition hover:text-indigo-500"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(resume._id)}
                    className="text-sm font-medium text-slate-400 transition hover:text-rose-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
export default DashboardPage;
