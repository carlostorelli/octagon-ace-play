import { BadgeCheck, Trophy, Medal, Award } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserBadgesProps {
  verified?: boolean;
  rank?: number | null;
  size?: "sm" | "md";
}

const UserBadges = ({ verified, rank, size = "sm" }: UserBadgesProps) => {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";

  return (
    <TooltipProvider delayDuration={200}>
      <span className="inline-flex items-center gap-1">
        {verified && (
          <Tooltip>
            <TooltipTrigger asChild>
              <BadgeCheck className={`${iconSize} text-blue-400 shrink-0`} />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Verificado</TooltipContent>
          </Tooltip>
        )}
        {rank === 1 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Trophy className={`${iconSize} text-yellow-400 shrink-0`} />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">🥇 1º Lugar</TooltipContent>
          </Tooltip>
        )}
        {rank === 2 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Medal className={`${iconSize} text-gray-300 shrink-0`} />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">🥈 2º Lugar</TooltipContent>
          </Tooltip>
        )}
        {rank === 3 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Award className={`${iconSize} text-amber-600 shrink-0`} />
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">🥉 3º Lugar</TooltipContent>
          </Tooltip>
        )}
      </span>
    </TooltipProvider>
  );
};

export default UserBadges;
