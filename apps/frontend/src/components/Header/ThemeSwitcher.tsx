import { Button, Dropdown, Label } from "@heroui/react"
import { Monitor, Moon, Sun } from "lucide-react"

import { useTheme } from "@/hooks/useTheme"

const themes = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
]

export function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <Dropdown>
      <Button
        variant="ghost"
        isIconOnly
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </Button>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu
          aria-label="Theme preference"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[theme]}
          onAction={(key) => setTheme(String(key))}
        >
          {themes.map(({ id, label, Icon }) => (
            <Dropdown.Item
              key={id}
              id={id}
              textValue={label}
            >
              <Icon className="size-4" />
              <Label>{label}</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
