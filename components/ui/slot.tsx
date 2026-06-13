"use client"

import * as React from "react"

export const Slot = React.forwardRef<HTMLElement, { children?: React.ReactNode } & Record<string, unknown>>(
  function Slot({ children, ...props }, ref) {
    if (React.isValidElement(children)) {
      const child = children as React.ReactElement<any>
      return React.cloneElement(child, {
        ...props,
        ...child.props,
        ref,
        className: [
          (props as { className?: string }).className,
          (child.props as { className?: string }).className,
        ]
          .filter(Boolean)
          .join(" "),
      })
    }
    if (React.Children.count(children) > 1) {
      React.Children.only(null)
    }
    return null
  },
)
