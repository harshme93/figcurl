import sys
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# df = pd.read_csv("C:/Users/harsh/Desktop/Study Material/Web Development/maiwae/background/maiwaesetcert.csv")
df = pd.read_csv("maiwaesetcert.csv")
# df['degree'] = df['degree'].str.lower()
df['title'] = df['title'].str.lower()
df['simpletags'] = df['simpletags'].str.lower()
df['deepertags'] = df['deepertags'].str.lower()
# df['Future_Profile'] = df['Future_Profile'].str.lower()
# print(df['keywords'])
features = ['title','simpletags','deepertags']
for feature in features:
    df[feature]=df[feature].fillna('')

def combine_features(row):
    return row['title']+" "+row['simpletags']+" "+row['deepertags']
df["combined_features"]=df.apply(combine_features,axis=1)
cv = CountVectorizer()
count_matrix = cv.fit_transform(df["combined_features"])
# print(count_matrix.toarray())
similarity_scores = cosine_similarity(count_matrix)
# print(similarity_scores)
cosine_sim = cosine_similarity(count_matrix)
# link input here
user_likes = (sys.argv[1]).lower()
# user_likes = ('Civil Engineer').lower()
def get_title_from_index(index):
 	return df[df.index == index]["title"].values[0]
def get_index_from_title(title):
 	return df[df.title == title]["index"].values[0]
movie_index = get_index_from_title(user_likes)
# print(movie_index)
similar_movie = list(enumerate(cosine_sim[int(movie_index)]))
sorted_similar_movie = sorted(similar_movie,key=lambda x:x[1],reverse=True)
i=0
coursedat=[]
for movie in sorted_similar_movie:
    coursedat.append(get_title_from_index(movie[0]))
    i=i+1
    if i>20:
        break

#checking for a few words first
removeTitleWords = ("engineer","Engineer","writer","examiner","banking","worker","advisor","researcher","coordinator","imaging","medicine")
course_rec = []
for name in coursedat:
    if name.endswith(removeTitleWords):
        coursedat.remove(name)
    else:
        course_rec.append(name)

if (len(course_rec)>=5):
    print(f"{course_rec[0].title()}|")
    print(f"{course_rec[1].title()}|")
    print(f"{course_rec[2].title()}|")
    print(f"{course_rec[3].title()}|")
    print(f"{course_rec[4].title()}")
elif(len(course_rec)==4):
    print(f"{course_rec[0].title()}|")
    print(f"{course_rec[1].title()}|")
    print(f"{course_rec[2].title()}|")
    print(f"{course_rec[3].title()}")
elif(course_rec[2]):
    print(f"{course_rec[0].title()}|")
    print(f"{course_rec[1].title()}|")
    print(f"{course_rec[2].title()}")
elif(course_rec[1]):
    print(f"{course_rec[0].title()}|")
    print(f"{course_rec[1].title()}")
elif(course_rec[0]):
    print(f"{course_rec[0].title()}")