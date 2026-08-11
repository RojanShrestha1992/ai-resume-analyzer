import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("resume", file);
    try {
      await API.post("/resume/upload", formData);
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status == 401) {
        navigate("/");
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-white text-lg">Uploading...</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div>
        {error && (
          <div className="bg-red-500 text-white px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center justify-center bg-gray-800 p-8 rounded-lg shadow-md"
      >
        <label className="text-white text-2xl">Upload a resume</label>
        <input
          className="text-white"
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default UploadPage;
