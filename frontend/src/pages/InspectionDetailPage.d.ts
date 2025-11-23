export declare const parseLLMPayload: (payload?: {
    score?: number;
    reason?: string;
} | string | null) => any;
export declare const extractLLMDetails: ({ payload, reason, score, }: {
    payload?: {
        score?: number;
        reason?: string;
    } | string | null;
    reason?: string | null;
    score?: number | null;
}) => {
    score: number;
    reason: any;
    payload: any;
};
declare const InspectionDetailPage: () => import("react/jsx-runtime").JSX.Element;
export default InspectionDetailPage;
