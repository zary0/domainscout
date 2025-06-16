import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Shield, 
  Zap, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  Info
} from "lucide-react";

interface DomainAnalysisCardProps {
  domain: string;
  isAvailable?: boolean;
  securityScore?: number;
  performanceScore?: number;
  overallScore?: number;
  status?: string;
  recommendations?: string[];
  risks?: string[];
}

export const DomainAnalysisCard: React.FC<DomainAnalysisCardProps> = ({
  domain,
  isAvailable,
  securityScore,
  performanceScore,
  overallScore,
  status,
  recommendations = [],
  risks = []
}) => {
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'excellent': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'good': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'fair': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'poor': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'unavailable': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-neutral-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAvailabilityIcon = () => {
    if (isAvailable === undefined) return <Info className="h-4 w-4" />;
    return isAvailable ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />;
  };

  return (
    <Card className="bg-neutral-700/50 border-neutral-600/50 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-neutral-100">{domain}</h3>
        </div>
        {status && (
          <Badge className={`${getStatusColor(status)} border px-3 py-1`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        )}
      </div>

      {/* Availability Status */}
      <div className="flex items-center gap-2 p-3 bg-neutral-800/50 rounded-lg">
        {getAvailabilityIcon()}
        <span className="text-sm font-medium text-neutral-200">
          {isAvailable === undefined 
            ? "Availability Unknown" 
            : isAvailable 
              ? "Available for Registration" 
              : "Currently Registered"
          }
        </span>
      </div>

      {/* Scores Grid */}
      {(overallScore !== undefined || securityScore !== undefined || performanceScore !== undefined) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {overallScore !== undefined && (
            <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-neutral-400" />
                <span className="text-sm text-neutral-400">Overall</span>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}/100
              </div>
            </div>
          )}
          
          {securityScore !== undefined && (
            <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-sm text-neutral-400">Security</span>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(securityScore)}`}>
                {securityScore}/100
              </div>
            </div>
          )}
          
          {performanceScore !== undefined && (
            <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-neutral-400">Performance</span>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>
                {performanceScore}/100
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-neutral-200">Recommendations</span>
          </div>
          <ul className="space-y-1 text-sm text-neutral-400">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks */}
      {risks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-neutral-200">Risks & Concerns</span>
          </div>
          <ul className="space-y-1 text-sm text-neutral-400">
            {risks.map((risk, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};