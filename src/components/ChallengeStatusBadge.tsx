// Reusable challenge status badge component
import { Badge } from "@/components/ui/badge";
import { isChallengeUpcoming, isChallengeActive, isChallengeCompleted } from "@/utils/challengeHelpers";

interface ChallengeStatusBadgeProps {
    startDate: Date;
    endDate: Date;
    isCompleted?: boolean;
    isSuccessful?: boolean;
}

export function ChallengeStatusBadge({
    startDate,
    endDate,
    isCompleted = false,
    isSuccessful = false
}: ChallengeStatusBadgeProps) {
    if (isChallengeUpcoming(startDate)) {
        return (
            <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border border-orange-500/20 font-medium">
                Upcoming
            </Badge>
        );
    }

    if (isChallengeCompleted(endDate) || isCompleted) {
        // Show success/failure status if completed
        if (isSuccessful) {
            return (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border border-green-500/20 font-medium">
                    Completed - Success
                </Badge>
            );
        }
        // Default completed status
        return (
            <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 border border-gray-500/20 font-medium">
                Ended
            </Badge>
        );
    }

    if (isChallengeActive(startDate, endDate)) {
        return (
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border border-green-500/20 font-medium">
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    Active
                </div>
            </Badge>
        );
    }

    return null;
}
