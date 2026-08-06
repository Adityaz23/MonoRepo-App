"use client"

import { Check, Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import Link from "next/link";
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Toggle theme"
            className="hover:cursor-pointer"
          />
        }
      >
        <Sun className="size-5 dark:hidden" />
        <Moon className="hidden size-5 dark:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="hover:cursor-pointer">
        {themeOptions.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            className="gap-2 cursor-pointer"
            onClick={() => setTheme(value)}
          >
            <Icon className="size-3.5" />
            {label}
            {theme === value && <Check className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {/*<span
            aria-hidden
            className="size-8 rounded-full bg-gradient-to-r from-primary-from via-primary-via to-primary-to"
          />*/}
          <Link href="/" className="text-sm font-bold tracking-tight hover:underline cursor-pointer transition-all duration-200">
            ThreadFlow
          </Link>
        </div>

        {/*<nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <a href="#" className="transition-colors hover:text-foreground">
            Home
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Messages
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Rooms
          </a>
        </nav>*/}

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Show when="signed-out">
            <SignInButton />
            <SignUpButton>
              <button className="h-10 cursor-pointer rounded-full bg-gradient-to-r from-primary-from via-primary-via to-primary-to px-5 text-sm font-medium text-white sm:text-base">
                Sign Up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  )
}
