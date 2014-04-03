# Datastructure of the application

```json
Recipe :
{
    "id": "cotes-de-porc-au-miel",
    "name": "Côtes de porc au miel",
    "image": "cotes-de-porc-au-miel.jpg",
    "category": "Plat principal",           // from a list
    "difficulty": "Très facile",            // from a list
    "budget": "Bon marché",
    "preparationTime": 15,
    "cookTime": 15,
    "servings": {"quantity": 4, "name": "personnes"},
    "ingredients": [ RecipeIngredient ],
    "instructions": [ RecipeInstruction ],
    "remark": "Se marie très bien avec du riz cantonnais.",
    "wine": "",
    "rating": 4,
    "source": "http://www.marmiton.org/recettes/recette_cotes-de-porc-au-miel_23576.aspx"
}
```

```json
RecipeIngredient :
{
    "quantity": 2,                  // number
    "unit": "kg",                   // from a list
    "pre": "de",
    "ingredient": {                 // from avaiable ingredients
        "id": "pomme-de-terre",
        "name": "Pomme de terre"
    },
    "post": "bien grosses",
    "role": "primary"               // from a list
}
```

```json
RecipeInstruction :
{
    "image": "",
    "text": ""
}
```
