import sys
import fileinput
import json


def main():
    verts = []
    elements = []  # emit lines pls

    for line in fileinput.input():
        if line.startswith("v "):
            try:
                _, a, b, c = line.split()
            except ValueError:
                raise ValueError("Cant parse line:", line)
            verts.append([float(a), float(b), float(c)])
        elif line.startswith("f "):
            _, *v = line.split()
            if len(v) == 3:
                a = v[0].split("/")[0]
                b = v[1].split("/")[0]
                c = v[2].split("/")[0]
                elements.append([int(a) - 1, int(b) - 1])
                elements.append([int(b) - 1, int(c) - 1])
                elements.append([int(c) - 1, int(a) - 1])
            elif len(v) == 4:
                # split quad into two triangles
                a = v[0].split("/")[0]
                b = v[1].split("/")[0]
                c = v[2].split("/")[0]
                d = v[3].split("/")[0]
                elements.append([int(a) - 1, int(b) - 1])
                elements.append([int(b) - 1, int(c) - 1])
                elements.append([int(c) - 1, int(d) - 1])
                elements.append([int(d) - 1, int(a) - 1])
            else:
                raise ValueError("Unsupported list of verts in face", line)

    max_dimension = max(coord for vert in verts for coord in vert)
    print("max_dimension", max_dimension, file=sys.stderr)

    if max_dimension:
        for vert in verts:
            for i in range(len(vert)):
                vert[i] /= max_dimension

    print(
        json.dumps(
            {
                "verts": verts,
                "elements": elements,
            }
        )
    )


if __name__ == "__main__":
    main()
