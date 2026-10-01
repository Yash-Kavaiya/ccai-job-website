import { LoginForm } from "@/components/auth/LoginForm";
import { Link } from "react-router-dom";
import { Brain } from "lucide-react";

export function RecruiterSignupPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-muted flex flex-col items-center justify-center p-4">
            <Link to="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 ai-gradient rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight">AIJobHub</span>
            </Link>

            <div className="w-full max-w-md">
                <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    Employer
                </p>
                <LoginForm defaultView="signup" role="recruiter" hideTabs={true} />

                <p className="text-center text-sm text-muted-foreground mt-4">
                    Already have an employer account?{" "}
                    <Link to="/recruiter/login" className="text-primary hover:underline font-medium">
                        Sign in
                    </Link>
                </p>
                <p className="text-center text-sm text-muted-foreground mt-2">
                    Looking for a job?{" "}
                    <Link to="/signup" className="text-primary hover:underline font-medium">
                        Candidate sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
