"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse-slow bg-muted rounded-md", className)}
      {...props}
    />
  );
}

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  className,
  size = "md",
  ...props
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}

interface LoadingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export function LoadingCard({
  className,
  lines = 3,
  ...props
}: LoadingCardProps) {
  return (
    <div className={cn("space-y-3 p-4", className)} {...props}>
      <Skeleton className="h-4 w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

interface LoadingTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
}

export function LoadingTable({
  className,
  rows = 5,
  columns = 4,
  ...props
}: LoadingTableProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {/* Header */}
      <div className="flex space-x-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-8 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

interface LoadingPageProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function LoadingPage({
  className,
  title = "Yükleniyor...",
  ...props
}: LoadingPageProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[400px] space-y-4",
        className
      )}
      {...props}
    >
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground animate-pulse">{title}</p>
    </div>
  );
}
