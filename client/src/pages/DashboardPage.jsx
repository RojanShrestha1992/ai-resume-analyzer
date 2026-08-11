import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
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
    } catch (err) {
      setError("Failed to delete resume.");
    }
  };
  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      navigate("/");
    } catch (err) {
      setError("Failed to logout.");
    }
  };
  const getStatusBadge = (status) => {
    const styles = {
      pending:
        "bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold",
      processing:
        "bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold",
      completed:
        "bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold",
      failed:
        "bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold",
    };
    return (
      <span
        className={`px-2 py-1 rounded-lg border text-xs font-medium ${styles[status]}`}
      ></span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Resume Analyzer</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/upload"
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-500 transition"
            >
              + Upload Reusme
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-500 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* content */}

      <div>
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {resumes.length === 0 ? (
          <div className="text-center text-slate-400 mt-20">
            <p className="text-slate-400 text-lg mb-4">No resumes found.</p>
            <Link
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-500 transition"
              to="/upload"
            >
              Upload a resume
            </Link>
          </div>
        ) : (
          <div>
            {resumes.map((resume) => (
              <div
                key={resume._id}
                className="bg-slate-900/80 border border-slate-50 rounded-xl p-5 flex items-center justify-between gap-4 mb-4 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <span>🧾</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">
                      {resume.originalName}
                    </h3>
                    <p className="text-sm text-slate-400">
                      Uploaded on: {new Date(resume.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {resume.score !== null && resume.score !== undefined && (
                    <span className="text-white font-bold">
                      {resume.score}/100
                    </span>
                  )}
                  {getStatusBadge(resume.analysisStatus)}
                  <Link
                    to={`/resume/${resume._id}`}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition"
                  >
                    View
                  </Link>

                  <button
                    onClick={() => handleDelete(resume._id)}
                    className="text-red-400 hover:text-red-300 text-sm transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default DashboardPage;
