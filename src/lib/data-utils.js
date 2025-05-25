export const clearTestData = () => {
  // Clear all test data
  localStorage.removeItem("products");
  localStorage.removeItem("dealers");
  localStorage.removeItem("bankAccounts");
  localStorage.removeItem("transactions");
  
  // Reset to empty arrays
  localStorage.setItem("products", JSON.stringify([]));
  localStorage.setItem("dealers", JSON.stringify([]));
  localStorage.setItem("bankAccounts", JSON.stringify([]));
  localStorage.setItem("transactions", JSON.stringify([]));
}; 