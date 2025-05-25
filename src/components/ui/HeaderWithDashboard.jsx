import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function HeaderWithDashboard({ children, tab }) {
  const navigate = useNavigate();
  // Determine which button to show based on tab
  let contextButton = null;
  if (tab === "transaction") {
    contextButton = (
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate("/transactions")}
        className="hover:bg-primary hover:text-white transition-colors"
      >
        View Transactions
      </Button>
    );
  } else if (tab === "product") {
    contextButton = (
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate("/products")}
        className="hover:bg-primary hover:text-white transition-colors"
      >
        View Products
      </Button>
    );
  } else if (tab === "dealer") {
    contextButton = (
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate("/dealers")}
        className="hover:bg-primary hover:text-white transition-colors"
      >
        Dealer Ledgers
      </Button>
    );
  } else if (tab === "bank") {
    contextButton = (
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate("/payments")}
        className="hover:bg-primary hover:text-white transition-colors"
      >
        View Payments
      </Button>
    );
  }
  return (
    <div className="flex justify-between items-center mb-6">
      <div>{children}</div>
      <div className="flex gap-2">
        {contextButton}
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="hover:bg-primary hover:text-white transition-colors"
        >
          Dashboard
        </Button>
      </div>
    </div>
  );
} 