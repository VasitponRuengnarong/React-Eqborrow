export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem("accessToken");

  const headers = { ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Default Content-Type to application/json if not provided and body is not FormData
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
      return response;
    }

    return response;
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
};
