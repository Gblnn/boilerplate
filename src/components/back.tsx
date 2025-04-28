import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Back() {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(-1)}>
      <ChevronLeft />
    </div>
  );
}
