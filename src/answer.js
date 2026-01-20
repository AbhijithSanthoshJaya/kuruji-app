export const ANSWERS = [
  {
    id: "ans-1",
    language: "Python",
    bruteCode:
      "def longest_unique_substring(s):\n  best = 0\n  for i in range(len(s)):\n    seen = set()\n    for j in range(i, len(s)):\n      if s[j] in seen:\n        break\n      seen.add(s[j])\n      best = max(best, j - i + 1)\n  return best",
    optimizedCode:
      "def longest_unique_substring(s):\n  left = 0\n  seen = {}\n  best = 0\n  for right, ch in enumerate(s):\n    if ch in seen and seen[ch] >= left:\n      left = seen[ch] + 1\n    seen[ch] = right\n    best = max(best, right - left + 1)\n  return best",
    explanation:
      "Uses a sliding window with last-seen index map to skip duplicates in O(n).",
  },
  {
    id: "ans-2",
    language: "JavaScript",
    bruteCode:
      "function mergeIntervals(intervals) {\n  const merged = [];\n  for (let i = 0; i < intervals.length; i++) {\n    const [start, end] = intervals[i];\n    let didMerge = false;\n    for (let j = 0; j < merged.length; j++) {\n      const [ms, me] = merged[j];\n      if (Math.max(start, ms) <= Math.min(end, me)) {\n        merged[j] = [Math.min(start, ms), Math.max(end, me)];\n        didMerge = true;\n        break;\n      }\n    }\n    if (!didMerge) merged.push([start, end]);\n  }\n  return merged;\n}",
    optimizedCode:
      "function mergeIntervals(intervals) {\n  intervals.sort((a, b) => a[0] - b[0]);\n  const merged = [intervals[0]];\n  for (let i = 1; i < intervals.length; i++) {\n    const last = merged[merged.length - 1];\n    const curr = intervals[i];\n    if (curr[0] <= last[1]) {\n      last[1] = Math.max(last[1], curr[1]);\n    } else {\n      merged.push(curr);\n    }\n  }\n  return merged;\n}",
    explanation: "Sort then merge in one pass to avoid nested overlap checks.",
  },
  {
    id: "ans-3",
    language: "Java",
    bruteCode:
      "List<List<Integer>> zigzag(TreeNode root) {\n  List<List<Integer>> res = new ArrayList<>();\n  if (root == null) return res;\n  Queue<TreeNode> q = new LinkedList<>();\n  q.add(root);\n  boolean left = true;\n  while (!q.isEmpty()) {\n    int size = q.size();\n    List<Integer> row = new ArrayList<>();\n    for (int i = 0; i < size; i++) {\n      TreeNode node = q.poll();\n      row.add(node.val);\n      if (node.left != null) q.add(node.left);\n      if (node.right != null) q.add(node.right);\n    }\n    if (!left) Collections.reverse(row);\n    res.add(row);\n    left = !left;\n  }\n  return res;\n}",
    optimizedCode:
      "List<List<Integer>> zigzag(TreeNode root) {\n  List<List<Integer>> res = new ArrayList<>();\n  if (root == null) return res;\n  Deque<TreeNode> dq = new ArrayDeque<>();\n  dq.add(root);\n  boolean left = true;\n  while (!dq.isEmpty()) {\n    int size = dq.size();\n    List<Integer> row = new ArrayList<>();\n    for (int i = 0; i < size; i++) {\n      if (left) {\n        TreeNode node = dq.pollFirst();\n        row.add(node.val);\n        if (node.left != null) dq.addLast(node.left);\n        if (node.right != null) dq.addLast(node.right);\n      } else {\n        TreeNode node = dq.pollLast();\n        row.add(node.val);\n        if (node.right != null) dq.addFirst(node.right);\n        if (node.left != null) dq.addFirst(node.left);\n      }\n    }\n    res.add(row);\n    left = !left;\n  }\n  return res;\n}",
    explanation: "Deque keeps order per level without reversing the list.",
  },
];


export const AnswerApiResponse = {
  id: "string",
  question_id: "string",
  title: "string",
  description: "string | null",
  language: "string | null",
  output_directory: "string | null",
  output_files: "array of strings | null",
  created_at: "string",
};

const isString = (value) => typeof value === "string";
const isNullableString = (value) => value === null || isString(value);
const isNullableStringArray = (value) =>
  value === null ||
  (Array.isArray(value) && value.every((item) => isString(item)));

export const validateAnswerApiResponse = (value) => {
  if (!value || typeof value !== "object") {
    return { valid: false, error: "Response is not an object." };
  }
  if (!isString(value.id)) {
    return { valid: false, error: "id must be a string." };
  }
  if (!isString(value.question_id)) {
    return { valid: false, error: "question_id must be a string." };
  }
  if (!isString(value.title)) {
    return { valid: false, error: "title must be a string." };
  }
  if (!isNullableString(value.description)) {
    return { valid: false, error: "description must be a string or null." };
  }
  if (!isNullableString(value.language)) {
    return { valid: false, error: "language must be a string or null." };
  }
  if (!isNullableString(value.output_directory)) {
    return { valid: false, error: "output_directory must be a string or null." };
  }
  if (!isNullableStringArray(value.output_files)) {
    return { valid: false, error: "output_files must be an array or null." };
  }
  if (!isString(value.created_at)) {
    return { valid: false, error: "created_at must be a string." };
  }
  return { valid: true, error: null };
};
