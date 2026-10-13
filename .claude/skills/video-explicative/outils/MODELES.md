# Choix des modèles Claude pour la commande (octobre 2026)

Synthèse de la documentation Anthropic et de guides d'utilisateurs ; appliquée dans `SKILL.md` §0. À revoir à chaque nouvelle génération de modèles.

| Constat | Source | Conséquence dans la commande |
|---|---|---|
| Opus : longs travaux autonomes, jugement, flux très visuels. Sonnet : travail courant (code, analyse, contenu, outils). Haiku 5.5 : gros volumes simples, tri, extraction, tâches de sous-agent. | [Choisir un modèle](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model), [Haiku 5.5](https://platform.claude.com/docs/en/models/haiku-5-5/whats-new-haiku-5-5) | Haiku : présélection Firestore. Sonnet : faits, plans. Opus : session principale (jugement, contrôle visuel) et casting. |
| Régler l'effort est souvent plus efficace que changer de modèle. | Choisir un modèle | `effort` précisé à chaque appel d'agent (bas / moyen / élevé selon le rôle). |
| « Un modèle frontière orchestre, des modèles moins chers exécutent » est rentable pour des tâches indépendantes, pas pour une chaîne dépendante. | [Optimiser coût et intelligence](https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence), [CloudZero](https://cloudzero.com/blog/claude-code-agents/) | Une session Opus + un agent Sonnet par plan ; escalade vers Opus seulement après deux échecs sur un même défaut. |
| Un sous-agent sans modèle précisé hérite du modèle de la session. Il ne voit pas la conversation : sa consigne est sa seule entrée ; son rapport revient dans le contexte principal. | [Sous-agents Claude Code](https://code.claude.com/docs/en/sub-agents), [Medium](https://medium.com/@roanmonteiro/claude-code-subagent-model-routing-stop-paying-for-opus-on-haiku-work-ee76dc32cb88) | Toujours `model` + `effort` ; consignes complètes ; rapports courts. |
| Français ≈ 97,5 % du niveau en anglais (Sonnet), ≈ 95,7 % (Haiku). | [Multilingue](https://platform.claude.com/docs/en/build-with-claude/multilingual-support) | Consignes et règles restent en français (l'utilisateur les lit et les corrige). |
| Balises de type XML pour séparer contexte, instructions, exemples ; étapes numérotées quand l'ordre compte. | [Bonnes pratiques de prompt](https://platform.claude.com/en/docs/build-with-claude/prompt-engineering/claude-prompting-best-practices) | Consignes d'agent en `<contexte>`, `<tache>`, `<regles>`, `<rapport>`. |
| Générateurs d'images : comprennent mieux l'anglais. | pratique courante | Prompt de couverture en anglais. |

Fable n'est pas utilisé (choix de l'utilisateur).
