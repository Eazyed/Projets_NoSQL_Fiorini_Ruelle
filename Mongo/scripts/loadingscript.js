//Connexion et création de la base de onnée
var db = connect('127.0.0.1:27017/Projet_Fiorini_Ruelle');

print("Le script va exécuter les différentes actions avec des pauses pour permettre de le suivre");
sleep(1000);

print('Création de la db');
//Création des collections
db.createCollection("Equipes");
db.createCollection("Joueurs");
db.createCollection("Matchs");
print('Création des collections');

//Récupération des fichiers de données
var fileequipe = cat('./Ligue/Equipes.json');
var filematchs = cat('./Ligue/Matchs.json');
var filejoueurs = cat('./Ligue/Joueurs.json');

sleep(2000);

//Conversion en json ignorant la mise en forme

print('parse équipe');
var jsonequipe = JSON.parse(fileequipe);
print('parse mathcs');
var jsonmatchs = JSON.parse(filematchs);
print('parse joueurs');
var jsonjoueurs = JSON.parse(filejoueurs);

sleep(2000);

//Insertion des éléments en itérant dans les tableaux
jsonequipe.forEach(function(element){
		db.Equipes.insert(element);
	});

jsonmatchs.forEach(function(element){
		db.Matchs.insert(element);
	});
	
jsonjoueurs.forEach(function(element){
		db.Joueurs.insert(element);
	});
print("Elements insérés");

sleep(2000);
//Création des indexs
print("creation des index :")
db.Joueurs.ensureIndex({"name":1});
db.Equipes.ensureIndex({"name":1});

//Récupération des indexs
db.getCollectionNames().forEach(function(coll) {
  db[coll].getIndexes().forEach(function(index) {
    if ("_id_" !== index.name) {
      print("db." + coll + ".ensureIndex(" + tojson(index.key) + ")");
	  printjson(index);
    }
  });
});

sleep(2000);

//Requête de recherche des défenseurs de plus de 25 ans (nés après 1995)
print("Recherche des défenseurs de plus de 25 ans (nés après 1995)")
var data = db.Joueurs.find(
{
	$and :
	[
	{"poste" : "DEF"},
	{"date de naissance" : {$gte:1995} }
	]
	
}
).pretty();

//Affichage des résultats en console
data.forEach(printjson);


//Exemple d'une requête d'insertion d'une équipe
print("Expression des requêtes d'insertion : ")
sleep(1000)
print("Insertion d'équipe : ")
print("db.Equipes.insert(");
print("{\"Label\" : \"Equipe\",\"nom\": \"Amiens SC\",\"couleurs\": [ \"gris\", \"noir\" ],\"stade\": \"Stade de la Licorne\",\"effectifs\": [ \"Moussa Konate\", \"Regis Gurtner\", \"Thomas Monconduit\", \"Cheick Timite\", \"Mathieu Bodmer\" ]}")
print(")");

//Exemple d'une requête d'insertion d'un joueur
sleep(5000)
print("Insertion de joueur : ")
print("db.Joueurs.insert(");
print("{\"Label\": \"Joueur\",\"nom\": \"Thomas Monconduit\",\"date de naissance\": 1990,\"taille\": 178,\"poids\": 75,\"poste\": \"MIL\"}")
print(")");


////Exemple d'une requête d'insertion d'un match
sleep(5000)
print("Insertion de Matchs : ")
print("db.Matchs.insert(");
print("{\"Label\":\"Match\",\"Date\": \"01-01-2019\",\"Journee\": 1,\"equipe domicile\":{\"nom\":\"Amiens SC\",\"score\": 0,\"joueurs\":[{\"nom\":\"Moussa Konate\",\"note\":3},{\"nom\":\"Regis Gurtner\",\"note\":6},{\"nom\":\"Thomas Monconduit\",\"note\":4}]},\"equipe exterieur\":{\"nom\": \"Angers SCO\",\"score\": 1,\"joueurs\": [{\"nom\": \"Ludovic Butelle\",\"note\": 7},{  \"nom\": \"Stephane Bahoken\",  \"note\": 7},{\"nom\": \"Vincent Manceau\",\"note\":6}]}")
print(")");
sleep(5000)


//Extraction des joueurs, avec leur nombre d'apparitions et leur moyenne
var joueursactifs = db.Matchs.aggregate(
    [
	// On groupe les matchs ensemble et on crée un tableau unique regroupant équipe extérieure et équipe domicile
        { 
            $group:
            {
                _id: "$Label",
                Equipes: { $push: { equipe1: "$equipe domicile", equipe2: "$equipe exterieur" } }
            }
        }, //On convertit le tableau en objet
		{
            "$unwind": "$Equipes"
        },// On replace la racine au niveau de l'objet contenant les deux équipes
        {
            $replaceRoot: { newRoot: "$Equipes" }
        },
        { // On regroupe les joueurs dans un seul tableau en fonction de leur équipe
            $group:
            {
                _id: null,
                Joueurs: { $push: { Joueurs1: "$equipe1.joueurs", Joueurs2: "$equipe2.joueurs" } }
            }
        },{ //On convertit le tableau de joueur en objet
            "$unwind": "$Joueurs"
        },
        {// On se repositionne au niveau de l'objet contenant les deux tableaux avec les joueurs
            $replaceRoot: { newRoot: "$Joueurs" }
        }, 
		{ //On fusionne les deux tableaux afin de n'avoir plus que un objet par match contenant un tableau avec tous les joueurs dedans
			$project: { Concat: { $concatArrays: ["$Joueurs1", "$Joueurs2"] } } 
		},
        { // On convertit ce tableau en objet
            "$unwind": "$Concat"
        }, { // On repositionne la racine au niveau de cet objet
            $replaceRoot: { newRoot: "$Concat" }
        }, { // Aggrégation par nom, on sort un champ apparitions qui correspond à un count en sql et un champs moyenne qui fait la moyenne des scores
            $group:
            {
                _id: "$nom",				
                Moyenne: { $avg: "$note" },
                Apparitions: {$sum : 1}
            }
        }

        ]
    )
// création de la collection des joueurs actifs
db.createCollection("Joueurslesplusactifs");
print("Collection créée");

//On itère sur chaque document récupéré dans la requête d'aggrégation précédente
joueursactifs.forEach(function(element){
	//On insère l'élément que si il a au moins 4 apparitions
	if(element.Apparitions>3)db.Joueurslesplusactifs.insert(element);

	});	

sleep(3000);

//Affichage	
var dataactifs = db.Joueurslesplusactifs.find();

dataactifs.forEach(printjson);
print("FIN");




