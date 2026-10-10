# Bourse — gestion de portefeuille

Application web pour suivre un petit portefeuille d'actions : ajout de titres, graphique de cours, calcul de profit ou perte et comparaison de deux actions.
Projet d'apprentissage en JavaScript vanilla.

## Stack

HTML · CSS · JavaScript · [Chart.js](https://www.chartjs.org/) · données [Stooq](https://stooq.com)

## Fonctionnalités

- Ajouter une action (ticker, quantité, prix d'achat), avec contrôle du format du ticker
- Graphique des 30 derniers jours de cotation, chargés depuis Stooq (bouton « Voir »)
- Calcul du profit ou de la perte entre deux dates
- Comparaison des deux premières actions du portefeuille
- Sauvegarde du portefeuille dans le navigateur (`localStorage`)

Le dernier prix affiché dans la liste et le calcul de profit ou perte reposent sur un historique simulé de 10 jours, généré à l'ajout de l'action.

## Lancer le projet

Aucune installation : ouvrir `index.html` dans un navigateur.

```bash
git clone https://github.com/marylineb/app-bourse.git
cd app-bourse
open index.html   # ou double-clic sur le fichier
```

## Auteure

Maryline Biloa · [Portfolio](https://marylinebiloa.com)
