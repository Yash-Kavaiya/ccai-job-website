import { LoginForm } from "@/components/auth/LoginForm";
import { Link } from "react-router-dom";
import { Brain } from "lucide-react";

export function CandidateSignupPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/40 to-secondary/40 flex flex-col items-center justify-center p-4">
            <Link to="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 ai-gradient rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight">AIJobHub</span>
            </Link>

            <div className="w-full max-w-md">
                <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    Candidate
                </p>
                <LoginForm defaultView="signup" role="candidate" hideTabs={true} showRoleSelector={false} />

                <p className="text-center text-sm text-muted-foreground mt-4">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                        Sign in
                    </Link>
                </p>
                <p className="text-center text-sm text-muted-foreground mt-2">
                    Hiring talent?{" "}
                    <Link to="/recruiter/signup" className="text-primary hover:underline font-medium">
                        Create employer account
                    </Link>
                </p>
            </div>
        </div>
    );
}
