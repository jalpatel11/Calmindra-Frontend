import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import type { FC } from "react";
import {
  ArrowDownIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  SendHorizontalIcon,
  Brain,
  HeartPulse,
  Leaf,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { ToolFallback } from "./tool-fallback";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="box-border flex h-full flex-col overflow-hidden bg-[#f7faf8]"
      style={{
        ["--thread-max-width" as string]: "42rem",
      }}
    >
      <ThreadPrimitive.Viewport className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-[linear-gradient(180deg,#f7faf8_0%,#ffffff_42%,#f7faf8_100%)] px-4 pt-8">
        <ThreadWelcome />

        <ThreadPrimitive.Messages
          components={{
            UserMessage: UserMessage,
            EditComposer: EditComposer,
            AssistantMessage: AssistantMessage,
          }}
        />

        <ThreadPrimitive.If empty={false}>
          <div className="min-h-8 flex-grow" />
        </ThreadPrimitive.If>

        <div className="sticky bottom-0 mt-3 flex w-full max-w-[var(--thread-max-width)] flex-col items-center justify-end bg-gradient-to-t from-[#f7faf8] via-[#f7faf8] to-transparent pb-4 pt-6">
          <ThreadScrollToBottom />
          <Composer />
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-8 rounded-full disabled:invisible"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex w-full max-w-[var(--thread-max-width)] flex-grow flex-col">
        <div className="flex w-full flex-grow flex-col items-center justify-center">
          <div className="mb-8 text-center">
            <div className="mb-5 flex items-center justify-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
                <Brain className="size-7" />
              </div>
            </div>
            <h1 className="mb-3 text-2xl font-semibold text-slate-950">
              What would help right now?
            </h1>
            <p className="max-w-md text-sm leading-6 text-slate-600">
              Share what is happening, slow down a racing thought, or take one small next step.
            </p>
          </div>
        </div>
        <ThreadWelcomeSuggestions />
      </div>
    </ThreadPrimitive.Empty>
  );
};

const ThreadWelcomeSuggestions: FC = () => {
  return (
    <div className="mt-6 grid w-full gap-3 sm:grid-cols-3">
      <ThreadPrimitive.Suggestion
        className="flex min-h-28 flex-col justify-between rounded-lg border border-emerald-900/10 bg-white p-4 text-left shadow-sm transition-colors ease-in hover:border-emerald-700/30 hover:bg-emerald-50/70"
        prompt="I am feeling overwhelmed. Can you help me ground myself?"
        method="replace"
        autoSend
      >
        <Leaf className="size-5 text-emerald-700" />
        <span className="line-clamp-2 text-ellipsis text-sm font-semibold text-slate-900">
          Ground me
        </span>
      </ThreadPrimitive.Suggestion>
      <ThreadPrimitive.Suggestion
        className="flex min-h-28 flex-col justify-between rounded-lg border border-rose-900/10 bg-white p-4 text-left shadow-sm transition-colors ease-in hover:border-rose-700/30 hover:bg-rose-50/70"
        prompt="I have a worry stuck in my head. Can you help me sort through it?"
        method="replace"
        autoSend
      >
        <HeartPulse className="size-5 text-rose-700" />
        <span className="line-clamp-2 text-ellipsis text-sm font-semibold text-slate-900">
          Unpack a worry
        </span>
      </ThreadPrimitive.Suggestion>
      <ThreadPrimitive.Suggestion
        className="flex min-h-28 flex-col justify-between rounded-lg border border-sky-900/10 bg-white p-4 text-left shadow-sm transition-colors ease-in hover:border-sky-700/30 hover:bg-sky-50/70"
        prompt="Help me choose one small next step for today."
        method="replace"
        autoSend
      >
        <ListChecks className="size-5 text-sky-700" />
        <span className="line-clamp-2 text-ellipsis text-sm font-semibold text-slate-900">
          One next step
        </span>
      </ThreadPrimitive.Suggestion>
    </div>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="flex w-full flex-wrap items-end rounded-2xl border border-emerald-950/10 bg-white px-2.5 shadow-[0_16px_45px_rgba(15,23,42,0.10)] transition-colors ease-in focus-within:border-emerald-700/40">
      <ComposerPrimitive.Input
        rows={1}
        autoFocus
        placeholder="Type a message or share what is on your mind..."
        className="max-h-40 flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 disabled:cursor-not-allowed"
      />
      <ComposerAction />
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  return (
    <>
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send"
            variant="default"
            className="my-2.5 size-9 rounded-xl bg-emerald-700 p-2 text-white transition-opacity ease-in hover:bg-emerald-800"
          >
            <SendHorizontalIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <TooltipIconButton
            tooltip="Cancel"
            variant="default"
            className="my-2.5 size-9 rounded-xl bg-slate-900 p-2 text-white transition-opacity ease-in hover:bg-slate-800"
          >
            <CircleStopIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 [&:where(>*)]:col-start-2 w-full max-w-[var(--thread-max-width)] py-4">
      <UserActionBar />

      <div className="col-start-2 row-start-2 max-w-[calc(var(--thread-max-width)*0.8)] break-words rounded-2xl bg-emerald-700 px-5 py-3 text-sm leading-6 text-white shadow-sm">
        <MessagePrimitive.Content />
      </div>

      <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="flex flex-col items-end col-start-1 row-start-2 mr-3 mt-2.5"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit" className="text-slate-500 hover:text-slate-900">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="my-4 flex w-full max-w-[var(--thread-max-width)] flex-col gap-2 rounded-lg border border-emerald-950/10 bg-white shadow-sm">
      <ComposerPrimitive.Input className="flex h-8 w-full resize-none bg-transparent p-4 pb-0 text-slate-900 outline-none" />

      <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost" className="text-slate-600">Cancel</Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button className="bg-emerald-700 text-white hover:bg-emerald-800">Send</Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="relative grid w-full max-w-[var(--thread-max-width)] grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr] gap-x-3 py-4">
      <div className="col-start-1 row-start-1 mt-1 flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white">
        <Brain className="size-4" />
      </div>
      <div className="col-start-2 row-start-1 my-1.5 max-w-[calc(var(--thread-max-width)*0.82)] break-words rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-800 shadow-sm">
        <MessagePrimitive.Content
          components={{ Text: MarkdownText, tools: { Fallback: ToolFallback } }}
        />
      </div>

      <AssistantActionBar />

      <BranchPicker className="col-start-2 row-start-2 -ml-2 mr-2" />
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="col-start-3 row-start-2 -ml-1 flex gap-1 text-slate-500 data-[floating]:absolute data-[floating]:rounded-md data-[floating]:border data-[floating]:bg-white data-[floating]:p-1 data-[floating]:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy">
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "inline-flex items-center text-xs text-slate-500",
        className
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

const CircleStopIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      width="16"
      height="16"
    >
      <rect width="10" height="10" x="3" y="3" rx="2" />
    </svg>
  );
};
