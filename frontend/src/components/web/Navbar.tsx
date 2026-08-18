'use client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import {
  Bell,
  Check,
  Menu,
  MessageSquare,
  Monitor,
  Moon,
  Sparkles,
  Sun,
  User,
  X,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full hover:cursor-pointer"
            aria-label="Toggle theme"
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
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileOpenMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  const navItems = [
    {
      href: '/chat',
      label: 'Chat',
      icon: MessageSquare,
      match: (p?: string | null) => p?.startsWith('chat'),
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: User,
      match: (p?: string | null) => p?.startsWith('profile'),
    },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpenMenu(false)
  }, [pathname])

  const desktopLink = (active: boolean) =>
    cn(
      'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150',
      active
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
    )

  const mobileLink = (active: boolean) =>
    cn(
      'flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-150',
      active
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
    )

  return (
    <header
      className={cn(
        'sticky top-0 z-50 h-14 w-full border-b backdrop-blur-md transition-all duration-300 md:h-16',
        scrolled
          ? 'border-border/70 bg-background/80 shadow-sm shadow-black/5'
          : 'border-transparent bg-background/50'
      )}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex shrink-0 cursor-pointer items-center gap-2 text-sm font-bold tracking-tight transition-colors"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-primary-from via-primary-via to-primary-to text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            <Sparkles className="size-4" />
          </span>
          <span className="hidden sm:inline">ThreadFlow</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={desktopLink(!!item.match(pathname))}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <ThemeToggle />

          <Show when="signed-out">
            <div className="hidden items-center gap-2 sm:flex">
              <SignInButton>
                <Button
                  variant="ghost"
                  className="rounded-full px-4 hover:cursor-pointer"
                >
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button className="rounded-full bg-linear-to-r from-primary-from via-primary-via to-primary-to px-5 text-white shadow-sm transition-opacity hover:opacity-90 hover:cursor-pointer">
                  Sign Up
                </Button>
              </SignUpButton>
            </div>
          </Show>

          <Show when="signed-in">
            <UserButton />
            <Link href={'/notifications'}>
              <Button
                size="icon-sm"
                variant="ghost"
                className="relative rounded-full text-muted-foreground hover:text-foreground hover:cursor-pointer"
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          </Show>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileOpenMenu(open => !open)}
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="animate-in slide-in-from-top-1 fade-in border-t border-border bg-background/95 duration-200 backdrop-blur-md md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={mobileLink(!!item.match(pathname))}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <Show when="signed-out">
            <div className="mx-auto flex max-w-6xl gap-2 px-4 pb-4 pt-1">
              <SignInButton>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl hover:cursor-pointer"
                >
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button className="flex-1 rounded-xl bg-linear-to-r from-primary-from via-primary-via to-primary-to text-white shadow-sm transition-opacity hover:opacity-90 hover:cursor-pointer">
                  Sign Up
                </Button>
              </SignUpButton>
            </div>
          </Show>
        </div>
      )}
    </header>
  )
}