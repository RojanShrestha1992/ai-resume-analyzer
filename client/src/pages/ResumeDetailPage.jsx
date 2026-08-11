import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";

const ResumeDetailPage = () => {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const fetchResume = async () => {
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
  };

  useEffect(() => {
    fetchResume();
  }, []);

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
      green: "border-green-500/30 bg-green-500/10 text-green-400",
      blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
      red: "border-red-500/30 bg-red-500/10 text-red-400",
      yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
      purple: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    };
    return (
      <div className="bg-slate-900/80 border border-slate-50 rounded-xl p-5">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => {
            return (
              <span
                key={index}
                className={`px-3 py-1 rounded-lg border text-sm ${colors[color]}`}
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <p className="text-red-400 text-lg mb-4">
            {error || "Resume not found."}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-950">
      {/* navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            className="text-slate-400 hover:text-white transition"
            to="/dashboard"
          >
            Back to dashboard
          </Link>
        </div>
        <h1 className="text-xl font-bold text-white">Resume Analyzer</h1>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Resume details content */}
        {error && (
          <div className="bg-red-500 text-white px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-slate-900/80 border border-slate-50 rounded-xl p-5 flex items-center justify-between gap-4 mb-4 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {resume.originalName}
              </h2>
              <p className="text-slate-400">
                Uploaded: {new Date(resume.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {resume.analysisStatus === "completed" && resume.score !== null && (
            <div className="flex flex-col items-center">
              <div
                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center 
                ${
                  resume.score >= 70
                    ? "border-green-500 text-green-500"
                    : resume.score >= 40
                      ? "border-yellow-500 text-yellow-500"
                      : "border-red-500 text-red-500"
                }
              `}
              >
                {" "}
                <span className="text-2xl font-bold">{resume.score}</span>
              </div>
              <span className="text-slate-500 text-xs mt-1">Score</span>
            </div>
          )}
        </div>

        {/* pending state */}
        {resume.analysisStatus === "pending" && (
          <div className="text-center text-slate-400 mt-20">
            <p className="text-slate-400 text-lg mb-4">
              Resume analysis is pending.
            </p>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-500 transition disabled:opacity-60"
            >
              {analyzing ? "Analyzing..." : "Analyze Resume"}
            </button>
          </div>
        )}

        {(resume.analysisStatus === "processing" || analyzing) && (
          <div className="text-center py-10">
            <div className="h-8 w-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">AI is analyzing your resume...</p>
          </div>
        )}

        {/* Failed State */}
        {resume.analysisStatus === "failed" && !analyzing && (
          <div className="text-center py-10">
            <p className="text-red-400 mb-4">
              Analysis failed. Please try again.
            </p>
            <button
              onClick={handleAnalyze}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-500 transition"
            >
              Retry Analysis
            </button>
          </div>
        )}

        {resume.analysisStatus === "completed" && (
          <div className="space-y-4">
            {renderedList("Skills", resume.skills, "blue")}
            {renderedList("Missing Skills", resume.missingSkills, "yellow")}
            {renderedList("Strengths", resume.strengths, "green")}
            {renderedList("Weakness", resume.weakness, "red")}
            {renderedList("Suggestions", resume.suggestions, "purple")}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeDetailPage;
