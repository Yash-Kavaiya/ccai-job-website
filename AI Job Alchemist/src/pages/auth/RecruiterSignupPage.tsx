import { LoginForm } from "@/components/auth/LoginForm";
import { Link } from "react-router-dom";
import { Brain } from "lucide-react";

export function RecruiterSignupPage() {
    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Link to="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 ai-gradient rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">AIJobHub</span>
            </Link>

            <div className="w-full max-w-md">
                <LoginForm defaultView="signup" role="recruiter" hideTabs={true} />

                <p className="text-center text-sm text-muted-foreground mt-4">
                    Already have an employer account?{" "}
                    <Link to="/recruiter/login" className="text-primary hover:underline font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
