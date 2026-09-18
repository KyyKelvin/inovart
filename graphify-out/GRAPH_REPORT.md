# Graph Report - test-artesao  (2026-09-14)

## Corpus Check
- 148 files · ~35,320 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 867 nodes · 1680 edges · 63 communities (48 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `223427ef`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- live-archive.tsx
- sidebar.tsx
- cn
- attachment.tsx
- inovart-api/index.ts
- empty.tsx
- combobox.tsx
- package.json
- dependencies
- InovArt — arquitetura, pesquisa e contrato de implementação
- compilerOptions
- button-group.tsx
- devDependencies
- createClient
- components.json
- admin-collection.tsx
- api-client.ts
- menubar.tsx
- server-api.ts
- utils.ts
- context-menu.tsx
- command.tsx
- carousel.tsx
- field.tsx
- class-variance-authority
- chart.tsx
- item.tsx
- prepare-3d-assets.mjs
- react
- drawer.tsx
- select.tsx
- app/layout.tsx
- breadcrumb.tsx
- navigation-menu.tsx
- notes/route.ts
- chatgpt-auth.ts
- AdminCollection
- popover.tsx
- scripts
- admin-dashboard.tsx
- toggle-group.tsx
- bubble.tsx
- tabs.tsx
- alert.tsx
- Q: Como os modelos 3D, paginas e estilos se relacionam no projeto?
- imports
- SubmissionReview
- admin-messages.tsx
- radix-ui
- hover-card.tsx
- sonner.tsx
- vite.config.ts
- install-ci.mjs
- cloudflare-env.d.ts
- drizzle-kit
- eslint.config.mjs
- engines
- postcss.config.mjs
- marker.tsx
- next

## God Nodes (most connected - your core abstractions)
1. `cn()` - 327 edges
2. `react` - 73 edges
3. `radix-ui` - 38 edges
4. `lucide-react` - 24 edges
5. `createClient()` - 18 edges
6. `class-variance-authority` - 17 edges
7. `compilerOptions` - 17 edges
8. `Link` - 14 edges
9. `Button()` - 13 edges
10. `publicClient()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `AccordionItem()` --calls--> `cn()`  [EXTRACTED]
  components/ui/accordion.tsx → lib/utils.ts
- `AccordionTrigger()` --calls--> `cn()`  [EXTRACTED]
  components/ui/accordion.tsx → lib/utils.ts
- `AccordionContent()` --calls--> `cn()`  [EXTRACTED]
  components/ui/accordion.tsx → lib/utils.ts
- `AlertDialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts
- `AlertDialogMedia()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert-dialog.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (63 total, 12 thin omitted)

### Community 0 - "live-archive.tsx"
Cohesion: 0.07
Nodes (36): metadata, Page(), metadata, metadata, metadata, metadata, Page(), ArchiveReliquary() (+28 more)

### Community 1 - "sidebar.tsx"
Cohesion: 0.05
Nodes (41): Input(), Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle() (+33 more)

### Community 2 - "cn"
Cohesion: 0.09
Nodes (33): Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage(), Card(), CardAction() (+25 more)

### Community 3 - "attachment.tsx"
Cohesion: 0.08
Nodes (28): Attachment(), AttachmentAction(), AttachmentActions(), AttachmentContent(), AttachmentDescription(), AttachmentGroup(), AttachmentMedia(), attachmentMediaVariants (+20 more)

### Community 4 - "inovart-api/index.ts"
Cohesion: 0.11
Nodes (31): zod, ApiError, checkProxy(), CleanupRow, db, digest(), editorial(), ensureMagick() (+23 more)

### Community 5 - "empty.tsx"
Cohesion: 0.29
Nodes (7): Empty(), EmptyContent(), EmptyDescription(), EmptyHeader(), EmptyMedia(), emptyMediaVariants, EmptyTitle()

### Community 6 - "combobox.tsx"
Cohesion: 0.09
Nodes (23): ComboboxChip(), ComboboxChips(), ComboboxChipsInput(), ComboboxClear(), ComboboxContent(), ComboboxEmpty(), ComboboxGroup(), ComboboxInput() (+15 more)

### Community 7 - "package.json"
Cohesion: 0.07
Nodes (27): name, packageManager, private, type, version, @cloudflare/vite-plugin, @cloudflare/workers-types, date-fns (+19 more)

### Community 8 - "dependencies"
Cohesion: 0.07
Nodes (30): dependencies, @base-ui/react, class-variance-authority, clsx, cmdk, date-fns, drizzle-orm, embla-carousel-react (+22 more)

### Community 9 - "InovArt — arquitetura, pesquisa e contrato de implementação"
Cohesion: 0.09
Nodes (19): Acesso editorial, Ativado, Estado da integração InovArt, Publicação, Arquitetura, Componentes 3D pesquisados e decisão de integração, Critérios de aceite, Direção visual absorvida (+11 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 11 - "button-group.tsx"
Cohesion: 0.38
Nodes (5): ButtonGroup(), ButtonGroupSeparator(), ButtonGroupText(), buttonGroupVariants, Separator()

### Community 12 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, @cloudflare/vite-plugin, @cloudflare/workers-types, drizzle-kit, eslint, eslint-config-next, react-server-dom-webpack, tailwindcss (+11 more)

### Community 13 - "createClient"
Cohesion: 0.19
Nodes (10): metadata, Callback(), authenticate(), AdminLogin(), submit(), createClient(), makeBrowserClient(), SUPABASE_KEY (+2 more)

### Community 14 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, registries, rsc (+9 more)

### Community 15 - "admin-collection.tsx"
Cohesion: 0.22
Nodes (13): Row, Table, Entry, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription() (+5 more)

### Community 16 - "api-client.ts"
Cohesion: 0.32
Nodes (6): ContactForm(), submit(), SubmissionForm(), submit(), ApiPayload, apiRequest()

### Community 17 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut() (+3 more)

### Community 18 - "server-api.ts"
Cohesion: 0.24
Nodes (8): POST(), POST(), POST(), createLimitedBodyStream(), RequestBodyLimitError, bodyLimits, clientFingerprint(), forwardToBackend()

### Community 19 - "utils.ts"
Cohesion: 0.06
Nodes (22): AccordionContent(), AccordionItem(), AccordionTrigger(), Checkbox(), InputOTP(), InputOTPGroup(), InputOTPSlot(), Progress() (+14 more)

### Community 20 - "context-menu.tsx"
Cohesion: 0.06
Nodes (18): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+10 more)

### Community 21 - "command.tsx"
Cohesion: 0.11
Nodes (16): Command(), CommandDialog(), CommandGroup(), CommandInput(), CommandItem(), CommandList(), CommandSeparator(), CommandShortcut() (+8 more)

### Community 22 - "carousel.tsx"
Cohesion: 0.17
Nodes (14): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+6 more)

### Community 23 - "field.tsx"
Cohesion: 0.09
Nodes (23): Field(), FieldContent(), FieldDescription(), FieldError(), FieldGroup(), FieldLabel(), FieldLegend(), FieldSeparator() (+15 more)

### Community 24 - "class-variance-authority"
Cohesion: 0.67
Nodes (3): Badge(), badgeVariants, class-variance-authority

### Community 25 - "chart.tsx"
Cohesion: 0.19
Nodes (12): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), getPayloadConfigFromPayload(), INITIAL_DIMENSION (+4 more)

### Community 26 - "item.tsx"
Cohesion: 0.18
Nodes (12): Item(), ItemActions(), ItemContent(), ItemDescription(), ItemFooter(), ItemGroup(), ItemHeader(), ItemMedia() (+4 more)

### Community 27 - "prepare-3d-assets.mjs"
Cohesion: 0.15
Nodes (8): alien, alienBuffer, alienMaterials, dark, darkBuffer, darkMaterials, darkOutput, root

### Community 28 - "react"
Cohesion: 0.24
Nodes (6): AdminGate(), nav, Link, LinkProps, accepted, react

### Community 29 - "drawer.tsx"
Cohesion: 0.17
Nodes (7): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle(), vaul

### Community 30 - "select.tsx"
Cohesion: 0.18
Nodes (7): SelectContent(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger()

### Community 31 - "app/layout.tsx"
Cohesion: 0.28
Nodes (5): metadata, links, SiteHeader(), Context, WebMcp()

### Community 32 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (6): BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage(), BreadcrumbSeparator()

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

### Community 41 - "bubble.tsx"
Cohesion: 0.38
Nodes (6): Bubble(), BubbleContent(), BubbleGroup(), BubbleReactions(), bubbleReactionsVariants, bubbleVariants

### Community 42 - "tabs.tsx"
Cohesion: 0.40
Nodes (5): Tabs(), TabsContent(), TabsList(), tabsListVariants, TabsTrigger()

### Community 43 - "alert.tsx"
Cohesion: 0.50
Nodes (4): Alert(), AlertDescription(), AlertTitle(), alertVariants

### Community 44 - "Q: Como os modelos 3D, paginas e estilos se relacionam no projeto?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Como os modelos 3D, paginas e estilos se relacionam no projeto?, Source Nodes

### Community 45 - "imports"
Cohesion: 0.40
Nodes (4): imports, @imagemagick/magick-wasm, @supabase/supabase-js, zod

### Community 47 - "admin-messages.tsx"
Cohesion: 0.29
Nodes (7): CollectionEditor(), save(), AdminMessages(), update(), Message, adminRequest(), slugify()

### Community 51 - "vite.config.ts"
Cohesion: 0.40
Nodes (3): vinext, vite, localBindingConfig

### Community 61 - "marker.tsx"
Cohesion: 0.50
Nodes (4): Marker(), MarkerContent(), MarkerIcon(), markerVariants

## Knowledge Gaps
- **206 isolated node(s):** `metadata`, `metadata`, `metadata`, `ChatGPTUser`, `metadata` (+201 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 302 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `live-archive.tsx`, `sidebar.tsx`, `cn`, `attachment.tsx`, `combobox.tsx`, `package.json`, `button-group.tsx`, `createClient`, `admin-collection.tsx`, `api-client.ts`, `menubar.tsx`, `utils.ts`, `context-menu.tsx`, `command.tsx`, `carousel.tsx`, `field.tsx`, `class-variance-authority`, `chart.tsx`, `item.tsx`, `drawer.tsx`, `select.tsx`, `app/layout.tsx`, `breadcrumb.tsx`, `navigation-menu.tsx`, `popover.tsx`, `admin-dashboard.tsx`, `toggle-group.tsx`, `bubble.tsx`, `tabs.tsx`, `alert.tsx`, `admin-messages.tsx`, `radix-ui`, `hover-card.tsx`, `marker.tsx`?**
  _High betweenness centrality (0.291) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `sidebar.tsx`, `attachment.tsx`, `empty.tsx`, `combobox.tsx`, `button-group.tsx`, `admin-collection.tsx`, `menubar.tsx`, `utils.ts`, `context-menu.tsx`, `command.tsx`, `carousel.tsx`, `field.tsx`, `class-variance-authority`, `chart.tsx`, `item.tsx`, `drawer.tsx`, `select.tsx`, `breadcrumb.tsx`, `navigation-menu.tsx`, `popover.tsx`, `toggle-group.tsx`, `bubble.tsx`, `tabs.tsx`, `alert.tsx`, `hover-card.tsx`, `marker.tsx`?**
  _High betweenness centrality (0.270) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **What connects `metadata`, `metadata`, `metadata` to the rest of the system?**
  _206 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `live-archive.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06656426011264721 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.054693877551020405 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.09446693657219973 - nodes in this community are weakly interconnected._