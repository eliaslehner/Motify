// Reusable challenge card component
import { Link } from "react-router-dom";
import { Users, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChallengeStatusBadge } from "@/components/ChallengeStatusBadge";
import { getServiceInfo, isGithubService } from "@/utils/serviceInfo";

export interface Challenge {
    id: number;
    title: string;
    description: string;
    serviceType: string;
    goalType: string;
    goalAmount: number;
    startDate: Date;
    endDate: Date;
    participants: number;
    isPrivate: boolean;
    isCompleted: boolean;
    duration: string;
}

interface ChallengeCardProps {
    challenge: Challenge;
    isParticipating?: boolean;
}

export function ChallengeCard({ challenge, isParticipating = false }: ChallengeCardProps) {
    const serviceInfo = getServiceInfo(challenge.serviceType);
    const isGithub = isGithubService(challenge.serviceType);

    return (
        <Link to={`/challenge/${challenge.id}`} className="block group">
            <Card className="p-5 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
                            backgroundSize: "24px 24px",
                        }}
                    ></div>
                </div>

                <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-12 h-12 rounded-full ${serviceInfo.color} flex items-center justify-center shadow-md overflow-hidden shrink-0 aspect-square transform-gpu ${isGithub ? "border-2 border-black" : ""
                                    }`}
                            >
                                {serviceInfo.logo ? (
                                    <img
                                        src={serviceInfo.logo}
                                        alt={serviceInfo.name}
                                        className="block w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                                    />
                                ) : (
                                    <TrendingUp className="w-6 h-6 text-white" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-muted-foreground tracking-wider">
                                    {serviceInfo.name}
                                </span>
                                <h3 className="font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors">
                                    {challenge.title}
                                </h3>
                            </div>
                        </div>
                        {/* Status Badge */}
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {isParticipating && (
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border border-blue-500/20 font-medium">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Joined
                                </Badge>
                            )}
                            <ChallengeStatusBadge
                                startDate={challenge.startDate}
                                endDate={challenge.endDate}
                                isCompleted={challenge.isCompleted}
                            />
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                        {challenge.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                            <span className="font-medium">{challenge.duration}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-semibold text-foreground">
                                    {challenge.participants}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
