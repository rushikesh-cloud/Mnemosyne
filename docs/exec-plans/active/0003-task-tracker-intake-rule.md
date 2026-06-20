# 0003 Task Tracker Intake Rule

## Context

This task updates agent operating instructions so every future task is recorded in `tasks.md` with a concrete timestamp and a complete task row before execution begins.

## Domains Touched

- Agent operating instructions.
- Task tracking and execution planning.
- Documentation process quality.

## Implementation Notes

- Update `AGENTS.md` to require task intake updates in `tasks.md` for any new task.
- Preserve the existing `tasks.md` table shape and status vocabulary.
- Record date/time in the task row notes unless a future schema change adds dedicated timestamp columns.
- Add the current task to `tasks.md` as an in-progress documentation process task.

## Test Plan

- Verify `AGENTS.md` contains an explicit task-intake rule for new tasks.
- Verify the rule requires proper date/time, next task ID, and the same table fields as existing tasks.
- Verify `tasks.md` includes this task with a valid status and timestamped notes.
- Verify documentation-only changes do not touch application code.

## Status

`completed`

## Verification

- Confirmed `AGENTS.md` includes an explicit `tasks.md` task-intake rule for new tasks.
- Confirmed the rule requires the next task ID, table-consistent task configuration, valid initial status, and proper date/time in notes.
- Confirmed `tasks.md` includes M0-T06 with a valid status and timestamped notes.
- Confirmed the change is documentation-only and does not touch application code.

## Completion Criteria

- Future agents have an unambiguous instruction to update `tasks.md` when a new task arrives.
- The instruction explains how to keep the task row consistent with existing tasks.
- The active execution plan and task tracker reflect this process change.
