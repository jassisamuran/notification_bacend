import json

data = []
for i in range(1, 101):
    data.append({
        "userId": i,
        "message": f"Hello user {i}",
        "type": "email" if i % 2 == 0 else "push"
    })

with open("users.json", "w") as f:
    json.dump(data, f, indent=2)
