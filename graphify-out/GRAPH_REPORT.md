# Graph Report - test-artesao  (2026-09-13)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 865 nodes · 1674 edges · 61 communities (47 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `117d09f7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- live-archive.tsx
- sidebar.tsx
- cn
- lucide-react
- inovart-api/index.ts
- class-variance-authority
- combobox.tsx
- package.json
- dependencies
- InovArt — arquitetura, pesquisa e contrato de implementação
- compilerOptions
- field.tsx
- devDependencies
- react
- components.json
- admin-collection.tsx
- safe-link.tsx
- menubar.tsx
- server-api.ts
- radix-ui
- context-menu.tsx
- dropdown-menu.tsx
- carousel.tsx
- form.tsx
- utils.ts
- chart.tsx
- item.tsx
- prepare-3d-assets.mjs
- attachment.tsx
- drawer.tsx
- select.tsx
- app/layout.tsx
- model-artifact.tsx
- navigation-menu.tsx
- notes/route.ts
- chatgpt-auth.ts
- AdminCollection
- popover.tsx
- scripts
- admin-dashboard.tsx
- toggle-group.tsx
- input-otp.tsx
- login/page.tsx
- resizable.tsx
- Q: Como os modelos 3D, paginas e estilos se relacionam no projeto?
- imports
- SubmissionReview
- adminRequest
- hover-card.tsx
- sonner.tsx
- vite.config.ts
- install-ci.mjs
- cloudflare-env.d.ts
- drizzle-kit
- eslint.config.mjs
- engines
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 327 edges
2. `react` - 72 edges
3. `radix-ui` - 38 edges
4. `lucide-react` - 24 edges
5. `createClient()` - 18 edges
6. `compilerOptions` - 17 edges
7. `class-variance-authority` - 17 edges
8. `Button()` - 13 edges
9. `Link` - 13 edges
10. `publicClient()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `SheetFooter()` --calls--> `cn()`  [EXTRACTED]
  components/ui/sheet.tsx → lib/utils.ts
- `SheetOverlay()` --calls--> `cn()`  [EXTRACTED]
  components/ui/sheet.tsx → lib/utils.ts
- `SidebarContent()` --calls--> `cn()`  [EXTRACTED]
  components/ui/sidebar.tsx → lib/utils.ts
- `SidebarFooter()` --calls--> `cn()`  [EXTRACTED]
  components/ui/sidebar.tsx → lib/utils.ts
- `SidebarGroup()` --calls--> `cn()`  [EXTRACTED]
  components/ui/sidebar.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (61 total, 10 thin omitted)

### Community 0 - "live-archive.tsx"
Cohesion: 0.08
Nodes (29): metadata, Page(), metadata, metadata, metadata, metadata, Page(), ArchiveReliquary() (+21 more)

### Community 1 - "sidebar.tsx"
Cohesion: 0.06
Nodes (40): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle(), Sidebar() (+32 more)

### Community 2 - "cn"
Cohesion: 0.08
Nodes (39): Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage(), BreadcrumbEllipsis(), BreadcrumbItem() (+31 more)

### Community 3 - "lucide-react"
Cohesion: 0.06
Nodes (34): Button(), buttonVariants, Calendar(), CalendarDayButton(), Command(), CommandDialog(), CommandGroup(), CommandInput() (+26 more)

### Community 4 - "inovart-api/index.ts"
Cohesion: 0.11
Nodes (32): zod, ApiError, checkProxy(), CleanupRow, db, digest(), editorial(), ensureMagick() (+24 more)

### Community 5 - "class-variance-authority"
Cohesion: 0.07
Nodes (27): Alert(), AlertDescription(), AlertTitle(), alertVariants, Bubble(), BubbleContent(), BubbleGroup(), BubbleReactions() (+19 more)

### Community 6 - "combobox.tsx"
Cohesion: 0.08
Nodes (24): ComboboxChip(), ComboboxChips(), ComboboxChipsInput(), ComboboxClear(), ComboboxContent(), ComboboxEmpty(), ComboboxGroup(), ComboboxInput() (+16 more)

### Community 7 - "package.json"
Cohesion: 0.07
Nodes (29): name, packageManager, private, type, version, @cloudflare/vite-plugin, @cloudflare/workers-types, cmdk (+21 more)

### Community 8 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, @base-ui/react, class-variance-authority, clsx, cmdk, date-fns, drizzle-orm, embla-carousel-react (+22 more)

### Community 9 - "InovArt — arquitetura, pesquisa e contrato de implementação"
Cohesion: 0.09
Nodes (19): Acesso editorial, Ativado, Estado da integração InovArt, Publicação, Arquitetura, Componentes 3D pesquisados e decisão de integração, Critérios de aceite, Direção visual absorvida (+11 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 11 - "field.tsx"
Cohesion: 0.13
Nodes (16): ButtonGroup(), ButtonGroupSeparator(), ButtonGroupText(), buttonGroupVariants, Field(), FieldContent(), FieldDescription(), FieldError() (+8 more)

### Community 12 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, @cloudflare/vite-plugin, @cloudflare/workers-types, drizzle-kit, eslint, eslint-config-next, react-server-dom-webpack, tailwindcss (+11 more)

### Community 13 - "react"
Cohesion: 0.20
Nodes (9): Callback(), authenticate(), AdminGate(), nav, AdminMessages(), Message, createClient(), makeBrowserClient() (+1 more)

### Community 14 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, registries, rsc (+9 more)

### Community 15 - "admin-collection.tsx"
Cohesion: 0.22
Nodes (13): Row, Table, Entry, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription() (+5 more)

### Community 16 - "safe-link.tsx"
Cohesion: 0.17
Nodes (10): ContactForm(), submit(), Link, LinkProps, links, accepted, SubmissionForm(), submit() (+2 more)

### Community 17 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut() (+3 more)

### Community 18 - "server-api.ts"
Cohesion: 0.20
Nodes (10): POST(), POST(), POST(), createLimitedBodyStream(), RequestBodyLimitError, bodyLimits, clientFingerprint(), forwardToBackend() (+2 more)

### Community 19 - "radix-ui"
Cohesion: 0.12
Nodes (7): AccordionContent(), AccordionItem(), AccordionTrigger(), Progress(), Slider(), Switch(), radix-ui

### Community 20 - "context-menu.tsx"
Cohesion: 0.12
Nodes (9): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+1 more)

### Community 21 - "dropdown-menu.tsx"
Cohesion: 0.12
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+1 more)

### Community 22 - "carousel.tsx"
Cohesion: 0.17
Nodes (14): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+6 more)

### Community 23 - "form.tsx"
Cohesion: 0.18
Nodes (12): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue, FormLabel() (+4 more)

### Community 24 - "utils.ts"
Cohesion: 0.15
Nodes (9): Badge(), badgeVariants, Checkbox(), RadioGroup(), RadioGroupItem(), ScrollArea(), ScrollBar(), clsx (+1 more)

### Community 25 - "chart.tsx"
Cohesion: 0.19
Nodes (12): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), getPayloadConfigFromPayload(), INITIAL_DIMENSION (+4 more)

### Community 26 - "item.tsx"
Cohesion: 0.18
Nodes (12): Item(), ItemActions(), ItemContent(), ItemDescription(), ItemFooter(), ItemGroup(), ItemHeader(), ItemMedia() (+4 more)

### Community 27 - "prepare-3d-assets.mjs"
Cohesion: 0.15
Nodes (8): alien, alienBuffer, alienMaterials, dark, darkBuffer, darkMaterials, darkOutput, root

### Community 28 - "attachment.tsx"
Cohesion: 0.20
Nodes (11): Attachment(), AttachmentAction(), AttachmentActions(), AttachmentContent(), AttachmentDescription(), AttachmentGroup(), AttachmentMedia(), attachmentMediaVariants (+3 more)

### Community 29 - "drawer.tsx"
Cohesion: 0.17
Nodes (7): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle(), vaul

### Community 30 - "select.tsx"
Cohesion: 0.18
Nodes (7): SelectContent(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger()

### Community 31 - "app/layout.tsx"
Cohesion: 0.22
Nodes (6): metadata, SiteHeader(), Context, WebMcp(), nextConfig, next

### Community 32 - "model-artifact.tsx"
Cohesion: 0.38
Nodes (7): loadViewer(), ModelArtifact(), ModelArtifactProps, getModelSceneUrl(), MODEL_SCENES, MODEL_VIEWER_SRC, ModelScene

### Community 33 - "navigation-menu.tsx"
Cohesion: 0.22
Nodes (9): NavigationMenu(), NavigationMenuContent(), NavigationMenuIndicator(), NavigationMenuItem(), NavigationMenuLink(), NavigationMenuList(), NavigationMenuTrigger(), navigationMenuTriggerStyle (+1 more)

### Community 34 - "notes/route.ts"
Cohesion: 0.36
Nodes (6): getDb(), GET(), POST(), toRouteErrorMessage(), notes, drizzle-orm

### Community 35 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 37 - "popover.tsx"
Cohesion: 0.25
Nodes (4): PopoverContent(), PopoverDescription(), PopoverHeader(), PopoverTitle()

### Community 38 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, db:generate, dev, install:ci, lint, start, test

### Community 39 - "admin-dashboard.tsx"
Cohesion: 0.33
Nodes (4): metadata, AdminDashboard(), labels, Submission

### Community 40 - "toggle-group.tsx"
Cohesion: 0.43
Nodes (5): ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 41 - "input-otp.tsx"
Cohesion: 0.33
Nodes (4): InputOTP(), InputOTPGroup(), InputOTPSlot(), input-otp

### Community 42 - "login/page.tsx"
Cohesion: 0.40
Nodes (3): metadata, AdminLogin(), submit()

### Community 43 - "resizable.tsx"
Cohesion: 0.40
Nodes (3): ResizableHandle(), ResizablePanelGroup(), react-resizable-panels

### Community 44 - "Q: Como os modelos 3D, paginas e estilos se relacionam no projeto?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Como os modelos 3D, paginas e estilos se relacionam no projeto?, Source Nodes

### Community 45 - "imports"
Cohesion: 0.40
Nodes (4): imports, @imagemagick/magick-wasm, @supabase/supabase-js, zod

### Community 47 - "adminRequest"
Cohesion: 0.67
Nodes (4): CollectionEditor(), save(), update(), adminRequest()

### Community 51 - "vite.config.ts"
Cohesion: 0.50
Nodes (3): vinext, vite, localBindingConfig

## Knowledge Gaps
- **206 isolated node(s):** `Particle`, `Card`, `XpImageFrameProps`, `Category`, `SidebarContextProps` (+201 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 300 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `live-archive.tsx`, `sidebar.tsx`, `cn`, `lucide-react`, `class-variance-authority`, `combobox.tsx`, `package.json`, `field.tsx`, `admin-collection.tsx`, `safe-link.tsx`, `menubar.tsx`, `radix-ui`, `context-menu.tsx`, `dropdown-menu.tsx`, `carousel.tsx`, `form.tsx`, `utils.ts`, `chart.tsx`, `item.tsx`, `attachment.tsx`, `drawer.tsx`, `select.tsx`, `app/layout.tsx`, `model-artifact.tsx`, `navigation-menu.tsx`, `popover.tsx`, `admin-dashboard.tsx`, `toggle-group.tsx`, `input-otp.tsx`, `hover-card.tsx`?**
  _High betweenness centrality (0.289) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `sidebar.tsx`, `lucide-react`, `class-variance-authority`, `combobox.tsx`, `field.tsx`, `admin-collection.tsx`, `menubar.tsx`, `radix-ui`, `context-menu.tsx`, `dropdown-menu.tsx`, `carousel.tsx`, `form.tsx`, `utils.ts`, `chart.tsx`, `item.tsx`, `attachment.tsx`, `drawer.tsx`, `select.tsx`, `navigation-menu.tsx`, `popover.tsx`, `toggle-group.tsx`, `input-otp.tsx`, `resizable.tsx`, `hover-card.tsx`?**
  _High betweenness centrality (0.271) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **What connects `Particle`, `Card`, `XpImageFrameProps` to the rest of the system?**
  _206 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `live-archive.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08144796380090498 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05673758865248227 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.07770582793709528 - nodes in this community are weakly interconnected._