  type TimeZoneOption = {
    text: string;
    value: string;
  };

  type TimeZoneNode = {
    text: string;
    children?: TimeZoneOption[];
  }
  
  export function getTimeZoneOptions(locale: string = navigator.language): TimeZoneNode[] {
    // 1. Get the list of time zones from Intl (where supported)
    let timeZones: string[] = [];
  
    const hasSupportedValuesOf =
      typeof (Intl as any).supportedValuesOf === "function";
  
    if (hasSupportedValuesOf) {
      timeZones = (Intl as any).supportedValuesOf("timeZone") as string[];
    } else {
      // Fallback: minimal set (you can extend this)
      timeZones = [
        "UTC",
        "Europe/Oslo",
        "Europe/London",
        "Europe/Paris",
        "America/New_York",
        "America/Los_Angeles",
        "Asia/Tokyo",
        "Asia/Shanghai",
        "Asia/Kolkata",
        "Australia/Sydney"
      ];
    }
  
    // 2. Build { text, value } options
    // Note: Intl.DisplayNames doesn't support type: "timeZone", so we format manually
    const options: Record<string, TimeZoneNode> = {};

    for (const tz of timeZones) {
      const [prefix, text] = tz.split("/") as [string, string];
      
      options[prefix] ??= {
        text: prefix,
        children: [],
      };
      
      options[prefix].children!.push({
        text,
        value: tz,
      });
    }
    
    return Object.values(options);
  }