import { useState, useEffect } from "react";
import { Email, Coach } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
    SendIcon,
    CheckCircleIcon,
    Sparkles,
    AlertCircle,
    UserRound,
    User,
    PenSquare,
    Calendar as CalendarIcon,
    Clock,
    Save,
    Trash2,
    PlusCircle,
    Mail,
    MailOpen,
    MailCheck,
    MailX,
    HelpCircle,
    Clock3,
    ChevronLeft,
    ChevronRight,
    Loader2,
    X,
    PencilLine,
    AtSign,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface ReceivedEmailsProps {
    email: Email;
    coach: Coach | null;
    getStatusBadge: (status: string) => React.JSX.Element;
    userProfile: any;
    filteredCoaches: Coach[];
}

// Define form schemas
const emailFormSchema = z.object({
    coachId: z.string(),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Message is required"),
    isDraft: z.boolean().default(false),
    followUpDays: z.number().optional(),
    enableFollowUp: z.boolean().optional(),
});

export const ReceivedEmails = ({
    email,
    coach,
    getStatusBadge,
    userProfile,
    filteredCoaches,
}: ReceivedEmailsProps) => {
    const { toast } = useToast();
    const [openEmail, setOpenEmail] = useState<boolean>(false);
    const [showEditEmail, setShowEditEmail] = useState<boolean>(false);
    const [sendingReply, setSendingReply] = useState<boolean>(false);

    // 1) compute the prefixed subject, only if it doesn’t already start with “Re:”
    const initialSubject = email.subject
        ? /^Re:/i.test(email.subject)
            ? email.subject
            : `Re: ${email.subject}`
        : "";

    // form fields
    const form = useForm({
        resolver: zodResolver(emailFormSchema),
        defaultValues: {
            coachId: email.coachId,
            subject: initialSubject,
            body: "",
            isDraft: false,
            followUpDays: 3,
            enableFollowUp: false,
        },
    });

    const coachFirstName = coach ? coach.firstName : "Unknown Coach";
    const coachLastName = coach ? coach.lastName : "";

    const coachFullName = `${coachFirstName} ${coachLastName}`;

    const school = coach ? coach.school : "Unknown School";

    const getDays = (scheduledForString: Date | string) => {
        const today = new Date();
        const scheduledFor = new Date(scheduledForString);
        const diffTime = scheduledFor.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const deleteEmailMutation = useMutation({
        mutationFn: async (emailId: number) => {
            const response = await apiRequest(
                "DELETE",
                `/api/emails/${emailId}`,
            );
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
            toast({
                title: "Success!",
                description: "Email deleted successfully.",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: "Failed to delete email. Please try again.",
                variant: "destructive",
            });
        },
    });

    const handleSaveAsDraft = async () => {
        const formValues = form.getValues();

        if (!formValues.body) {
            toast({
                title: "Error",
                description: "Email body is required.",
                variant: "destructive",
            });
        }

        try {
            const emailData = {
                coachId: formValues.coachId,
                subject: formValues.subject,
                body: formValues.body,
                templateId: null,
                isFollowUp: formValues.enableFollowUp,
                followUpDays: formValues.enableFollowUp
                    ? formValues.followUpDays
                    : undefined,
                gmailThreadId: email.gmailThreadId,
            };

            const res = await apiRequest(
                "POST",
                "/api/emails/replies/draft",
                emailData,
            );

            if (!res.ok) {
                throw new Error(`Failed to save draft for coach ${coach?.id}`);
            }
            const draft = await res.json();
            toast({
                title: "Draft saved",
                description: "Your email has been stored as a draft.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
        } catch (error) {
            console.error("Error saving draft:", error);
            toast({
                title: "Error",
                description: "Failed to save draft." + error.message,
                variant: "destructive",
            });
        } finally {
            setShowEditEmail(false);
        }
    };

    const handleSendReply = async () => {
        const formValues = form.getValues();

        if (!formValues.body) {
            toast({
                title: "Error",
                description: "Email body is required.",
                variant: "destructive",
            });
        }

        setSendingReply(true);

        try {
            const emailData = {
                coachId: formValues.coachId,
                subject: formValues.subject,
                body: formValues.body,
                templateId: undefined,
                isFollowUp: formValues.enableFollowUp,
                followUpDays: formValues.enableFollowUp
                    ? formValues.followUpDays
                    : undefined,
                gmailThreadId: email.gmailThreadId,
            };

            const res = await apiRequest(
                "POST",
                "/api/emails/replies/send",
                emailData,
            );

            if (!res.ok) {
                throw new Error(`Failed to send reply to coach ${coach?.id}`);
            }
            const reply = await res.json();
            toast({
                title: "Reply Sent",
                description: "Your email has been sent successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
            setSendingReply(false);
        } catch (error) {
            console.error("Error sending reply:", error);
            toast({
                title: "Error",
                description: "Failed to send reply." + error.message,
                variant: "destructive",
            });
            setSendingReply(false);
        } finally {
            setShowEditEmail(false);
        }
    };

    return (
        <>
            <Card className="border border-gray-200 border-l-4 border-l-purple-500">
                <CardContent className="p-5">
                    <div className="flex flex-col space-y-3">
                        {/* Header with subject and date */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-base font-semibold">
                                    {email.subject || "No Subject"}
                                </h4>

                                <div className="flex items-center mt-1">
                                    <Badge
                                        variant="outline"
                                        className="text-purple-700 bg-purple-50 border-purple-200 mr-2"
                                    >
                                        Received
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {formatDate(
                                            email.receivedAt || email.sentAt,
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setOpenEmail(true)}
                                >
                                    View
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowEditEmail(true)}
                                >
                                    Reply
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-500 border-red-200 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                Delete Email
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete
                                                this received email? This action
                                                cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-red-500 hover:bg-red-600"
                                                onClick={() => {
                                                    deleteEmailMutation.mutate(
                                                        email.id,
                                                    );
                                                }}
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>

                        {/* Coach info */}
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium">
                                From: {coachFullName}{" "}
                                <span className="text-muted-foreground font-normal">
                                    {school}
                                </span>
                            </span>
                        </div>

                        {/* Email preview */}
                        <div className="bg-gray-50 rounded-md py-3 px-4 border border-gray-100">
                            <p className="text-sm text-gray-700 line-clamp-3 whitespace-pre-line">
                                {email.body || "No content"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            {/* View Email Dialog */}
            <Dialog open={openEmail} onOpenChange={setOpenEmail}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            View Email
                        </DialogTitle>
                        <DialogDescription>Email details</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {getStatusBadge(email.status)}
                                {email.sentAt && (
                                    <div className="text-sm text-muted-foreground flex items-center">
                                        <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                                        {formatDate(email.sentAt)}
                                    </div>
                                )}
                            </div>

                            {email.status === "draft" && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        // Edit the draft
                                        if (coach) {
                                            // Close view dialog and open compose dialog
                                            setOpenEmail(false);
                                            setShowEditEmail(true);
                                        } else {
                                            toast({
                                                title: "Error",
                                                description:
                                                    "Could not find the coach associated with this email",
                                                variant: "destructive",
                                            });
                                        }
                                    }}
                                >
                                    <PencilLine className="h-4 w-4 mr-2" />
                                    Edit Draft
                                </Button>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-medium mb-1">
                                {email.subject || "No Subject"}
                            </h3>

                            {/* Coach information */}
                            {coach && (
                                <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                                    <div>
                                        {coach ? (
                                            <>
                                                <p className="text-sm font-medium">
                                                    To:{" "}
                                                    {`${coach.firstName} ${coach.lastName} (${coach.school})`}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {coach.email}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Coach information not available
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Email body */}
                            <div className="mt-4 text-sm whitespace-pre-wrap">
                                {email.body || "No content"}
                            </div>

                            {/* Follow-up info if applicable */}
                            {email.scheduledFor && (
                                <div className="mt-5 pt-3 border-t text-sm text-muted-foreground">
                                    <p className="flex items-center">
                                        <Clock className="h-4 w-4 mr-2" />
                                        Follow-up scheduled in{" "}
                                        {getDays(email.scheduledFor)} days
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="mt-6 gap-2">
                        {email.status === "draft" && (
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    deleteEmailMutation.mutate(email.id);
                                    setOpenEmail(false);
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Draft
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => setOpenEmail(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Reply Modal */}
            <Dialog open={showEditEmail} onOpenChange={setShowEditEmail}>
                <DialogContent className="sm:max-w-[920px] max-h-[90vh] overflow-y-auto overflow-x-hidden p-0">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-1.5 border-b">
                        <h2 className="text-base font-semibold text-primary/90 flex items-center">
                            <PencilLine className="h-3.5 w-3.5 mr-1.5" />
                            Reply to {coachFullName}
                        </h2>
                    </div>
                    <div className="p-3">
                        <div className="space-y-5">
                            {/* Modern, cleaner email form */}
                            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                                {/* To field with pill design for recipients */}
                                <div className="border-b p-3">
                                    <div className="flex items-center">
                                        <AtSign className="h-4 w-4 mr-2 text-gray-500" />
                                        <span className="text-sm text-gray-700 font-medium mr-2">
                                            To:
                                        </span>
                                        <div className="flex-1">
                                            {coach ? (
                                                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                                                    {coach.firstName}{" "}
                                                    {coach.lastName}
                                                    <span className="ml-1 text-gray-500">
                                                        &lt;{coach.email}
                                                        &gt;
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">
                                                    No recipients selected
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Subject field with clean separator */}
                                <div className="border-b p-3">
                                    <div className="flex items-center">
                                        <span className="text-sm text-gray-700 font-medium mr-2">
                                            Subject:
                                        </span>
                                        <Input
                                            {...form.register("subject")}
                                            placeholder="Write a compelling subject line"
                                            className="border-none shadow-none focus-visible:ring-0 flex-1 p-0 h-6 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Message body with clean styling */}
                                <div className="p-3">
                                    <Textarea
                                        {...form.register("body")}
                                        placeholder="Write your personalized message…"
                                        className="border-none h-[230px] resize-none focus-visible:ring-0 p-0 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Modern follow-up section with card design */}
                            <div className="mt-2.5">
                                <div
                                    className={`rounded-lg border ${form.watch("enableFollowUp") ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"} overflow-hidden transition-colors duration-300 ease-in-out`}
                                >
                                    <div className="p-3 flex items-center">
                                        <div className="flex items-center flex-1">
                                            <Clock3
                                                className={`h-4 w-4 mr-2 ${form.watch("enableFollowUp") ? "text-blue-500" : "text-gray-400"}`}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center">
                                                    <Checkbox
                                                        id="enable-follow-up"
                                                        className={
                                                            form.watch(
                                                                "enableFollowUp",
                                                            )
                                                                ? "text-blue-500 border-blue-400"
                                                                : ""
                                                        }
                                                        checked={form.watch(
                                                            "enableFollowUp",
                                                        )}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) => {
                                                            form.setValue(
                                                                "enableFollowUp",
                                                                !!checked,
                                                            );
                                                            if (
                                                                checked &&
                                                                !form.getValues()
                                                                    .followUpDays
                                                            ) {
                                                                form.setValue(
                                                                    "followUpDays",
                                                                    3,
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <Label
                                                        htmlFor="enable-follow-up"
                                                        className={`ml-2 text-sm font-medium ${form.watch("enableFollowUp") ? "text-blue-700" : "text-gray-700"}`}
                                                    >
                                                        Schedule automatic
                                                        follow-up
                                                    </Label>
                                                </div>

                                                {form.watch(
                                                    "enableFollowUp",
                                                ) && (
                                                    <p className="text-xs text-blue-600 ml-6 mt-1">
                                                        A follow-up email will
                                                        be sent if no response
                                                        is received
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Always render the days selector but change style based on state */}
                                        <div
                                            className={`flex items-center transition-opacity duration-200 ${form.watch("enableFollowUp") ? "opacity-100" : "opacity-40"}`}
                                        >
                                            <div
                                                className={`flex items-center px-2 py-1 rounded-full ${form.watch("enableFollowUp") ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"}`}
                                            >
                                                <span className="text-xs mr-1">
                                                    after
                                                </span>
                                                <Select
                                                    value={String(
                                                        form.watch(
                                                            "followUpDays",
                                                        ) || 3,
                                                    )}
                                                    onValueChange={(value) =>
                                                        form.setValue(
                                                            "followUpDays",
                                                            parseInt(value),
                                                        )
                                                    }
                                                    disabled={
                                                        !form.watch(
                                                            "enableFollowUp",
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={`w-[80px] h-6 text-xs border-none bg-transparent focus:ring-0 ${!form.watch("enableFollowUp") ? "opacity-50" : ""}`}
                                                    >
                                                        <SelectValue placeholder="3 days" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[
                                                            1, 2, 3, 4, 5, 6, 7,
                                                            8, 9, 10,
                                                        ].map((days) => (
                                                            <SelectItem
                                                                key={days}
                                                                value={days.toString()}
                                                            >
                                                                {days}{" "}
                                                                {days === 1
                                                                    ? "day"
                                                                    : "days"}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Redesigned modern action buttons with fixed heights and consistent spacing */}
                            <div className="flex justify-between mt-4 py-2.5 border-t">
                                <div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="text-gray-600 border-gray-200 hover:bg-gray-50"
                                        onClick={() => setShowEditEmail(false)}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>

                                {/* Modern, consistent button group with smooth hover effects */}
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50 w-[140px] transition-colors"
                                        onClick={() => handleSaveAsDraft()}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save as Draft
                                    </Button>

                                    {/* Middle button - using fixed width and conditionally showing content */}
                                    <Button
                                        type="button"
                                        className="bg-blue-600 hover:bg-blue-700 text-white w-[180px] px-4"
                                        onClick={() => handleSendReply()}
                                        disabled={sendingReply}
                                    >
                                        <SendIcon className="h-4 w-4 mr-2" />
                                        {sendingReply ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            "Send Reply"
                                        )}
                                    </Button>

                                    {/* Fixed width "Send All" button */}
                                    <Button
                                        type="button"
                                        className={`bg-gray-300 hover:bg-gray-300 cursor-not-allowed text-white w-[130px] px-4`}
                                        disabled={true}
                                    >
                                        <SendIcon className="h-4 w-4 mr-2" />
                                        Send All{" "}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
