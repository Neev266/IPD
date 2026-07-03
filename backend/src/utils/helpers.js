export const cleanString = (str) => {
  return str.replace(/\s+/g, "_").trim();
};

export const getFileExtension = (filename) => {
  return filename.split(".").pop().toLowerCase();
};
