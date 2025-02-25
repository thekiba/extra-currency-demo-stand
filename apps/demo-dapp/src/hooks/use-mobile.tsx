import * as React from "react"

/**
 * Threshold value for screen width to determine mobile device
 */
const MOBILE_BREAKPOINT = 768

/**
 * Hook for detecting mobile devices
 * Tracks window size changes and determines if the current device is mobile
 * based on the screen width threshold value
 * 
 * @returns Boolean value, true if the device is mobile
 */
export function useIsMobile() {
  // undefined initially, until determined on the client
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  // Add a screen size change listener when the component mounts
  React.useEffect(() => {
    const mediaQueryList = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const handleMediaQueryChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Register the listener
    mediaQueryList.addEventListener("change", handleMediaQueryChange)
    
    // Set initial value
    handleMediaQueryChange()
    
    // Clean up the listener when the component unmounts
    return () => mediaQueryList.removeEventListener("change", handleMediaQueryChange)
  }, [])

  // If value is undefined, return false by default
  return !!isMobile
}
